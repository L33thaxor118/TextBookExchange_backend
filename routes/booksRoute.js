const { Router } = require('express');
const axios = require('axios');
const {
  modifyAllOrNone,
  notFoundMiddleware,
  registerAsyncHandlers,
  uniqueDocumentMiddleware,
} = require('./util');
const Book = require('../models/book');
const Course = require('../models/course');

const lookupBookByISBN = isbn => axios.get('https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn).then(({ data }) => data);

const booksRouter = Router({ mergeParams: true });
registerAsyncHandlers(booksRouter);

/* Middleware */
const wrapNotFound = notFoundMiddleware(Book);
const wrapUniqueIsbn = uniqueDocumentMiddleware(Book, 'isbn');

const fetchBookAndPopulate = id => Book.findById(id).populate({ path: 'courses', model: Course, select: '-books' });

/* Begin /books route */

const getAllBooks = () => Book.find({}).populate({ path: 'courses', model: Course, select: '-books'});

const getBooksByCourse = async (subject, courseNumber) => {
  let query = Course.where('department').equals(subject);
  if (courseNumber) {
    query = query.where('number').equals(courseNumber);
  }

  const courses = await query;
  let bookIds = new Set();

  if (!courses.length) {
    return null;
  } else {
    courses.forEach(course => course.books.forEach(bookIds.add.bind(bookIds)));
  }

  return Promise.all([...bookIds].map(fetchBookAndPopulate));
};

const booksGetHandler = async (req, res) => {
  const { subject, course_num: courseNumber } = req.query;

  if (!subject && !courseNumber) {
    const books = await getAllBooks();
    return res.json({ books });
  } else if (subject) {
    const books = await getBooksByCourse(subject, courseNumber);
    
    if (books == null) {
      return res.status(404).json({
        message: `No course found with the corresponding subject and number.`
      });
    } else {
      return res.json({ books });
    }
  } else {
    // Here, courseNumber is provided but not subject,
    // so return a 400 error
    return res.status(400).json({
      message: 'Missing subject parameter in querystring',
    });
  }
};

const createBook = wrapUniqueIsbn(async (req, res) => {
  const { isbn, courses = [], authors = [] } = req.body;

  const bookInfo = await lookupBookByISBN(isbn);

  // Check that the Google API recognizes the ISBN
  if (bookInfo.totalItems < 1) {
    return manualCreateBook(req, res);
  } else if (req.body.title || authors.length) {
    // User provided a valid ISBN but provided title and/or authors field
    // which is not allowed, since we will be populating those fields here
    return res.status(400).json({
      errorType: 'UNEXPECTED_ARGUMENT',
      message: `Received unexpected argument '${req.body.title ? 'title' : 'authors'}' for book with valid ISBN.`
    });
  }

  let { title, subtitle, authors: foundAuthors } = bookInfo.items[0].volumeInfo; 

  // If the book exists, extract the title
  if (subtitle) {
    title += `: ${subtitle}`;
  }

  const book = new Book({
    isbn,
    title,
    courses,
    authors: foundAuthors
  });

  await createAndSaveBook(res, book);
});

const manualCreateBook = async (req, res) => {
  const { isbn, title, courses = [], authors = [] } = req.body;
  // If the user only provides an isbn field and it is invalid,
  // return an error
  if (isbn && !title && !authors.length) {
    return res.status(400).json({
      errorType: 'INVALID_ISBN',
      message: `Invalid ISBN '${isbn}' provided.`
    });
  }

  // Otherwise, we assume the user is attempting to create a new book,.
  // If the request is missing any of the required book fields, we return an error.
  const expectedFields = [
    {field: isbn, errorType: 'MISSING_ISBN', message: 'Missing required field \'isbn\''},
    {field: title, errorType: 'MISSING_TITLE', message: 'Missing required field \'title\''},
    {field: authors.length, errorType: 'MISSING_AUTHORS', message: 'Missing required field \'authors\''},
  ];

  for (let { field, errorType, message } of expectedFields) {
    if (!field) {
      return res.status(400).json({ errorType, message });
    }
  }

  // Otherwise create and save the book
  const book = new Book({
    isbn,
    title,
    courses,
    authors,
  });

  await createAndSaveBook(res, book);
};

const createAndSaveBook = async (res, book) => {
  const courses = book.courses;

  // Check that all courses already exist in the database before proceeding
  const { success, execUpdates, missingDocumentId } = await modifyAllOrNone({
    model: Course,
    documentIds: courses,
    // We need to defer updates on these courses because
    // we don't have the created book id yet.
    deferUpdates: true,
  });

  if (success) {
    const createdBook = await book.save();
    const { id } = createdBook;

    // Pass in an update function for each course now that
    // we know the book id.
    await execUpdates(course => !course.books.includes(id)
      ? { books: [...course.books, id] }
      : {}
    );

    res.status(201).json({
      message: 'OK created',
      book: await fetchBookAndPopulate(id),
    });
  } else {
    res.status(400).json({
      message: `No course found with ID ${missingDocumentId}.`
    });
  }
};

booksRouter.asyncRoute('/')
  .get(booksGetHandler)
  .post(createBook);

/* Begin /books/:id route */

const getBookById = async (req, res) => res.status(200).json({
  book: await fetchBookAndPopulate(req.params.id),
});

const updateBookById = async (req, res, existingBook) => {
  // Only allow the courses field to be updated
  const { courses } = req.body;
  const { id } = existingBook;

  if (courses) {
    // Only modify course documents if all of them are valid
    const { success, missingDocumentId } = await modifyAllOrNone({
      model: Course,
      documentIds: courses,
      updateFn: course => !course.books.includes(id)
        ? { books: [...course.books, id] }
        : {}
    });

    if (success) {
      existingBook.courses = courses;
      await existingBook.save();
      
      res.status(200).json({
        message: 'Successfully updated book',
        book: await fetchBookAndPopulate(id),
      });
    } else {
      res.status(400).json({
        message: `No course found with ID ${missingDocumentId}.`
      });
    }
  } else {
    res.status(200).json({
      message: 'OK',
      book: await fetchBookAndPopulate(id),
    });
  }
};

const deleteBookById = async (req, res, book) => {
  const { id } = req.params;

  await Promise.all(book.courses.map(async courseId => {
    const course = await Course.findById(courseId);
    course.books = course.books.filter(bookId => bookId !== id);
    return course.save();
  }));

  await Book.deleteOne({_id: id});
  res.json({ book });
};

booksRouter.asyncRoute('/:id')
  .get(wrapNotFound(getBookById))
  .put(wrapNotFound(updateBookById))
  .delete(wrapNotFound(deleteBookById));

module.exports = router => router.use('/books', booksRouter);
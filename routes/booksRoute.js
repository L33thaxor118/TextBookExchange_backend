const { Router } = require('express');
const { registerAsyncHandlers } = require('./util');
const Book = require('../models/book');

const booksRouter = Router({ mergeParams: true });
registerAsyncHandlers(booksRouter);

/* Begin /books route */

const getAllBooks = async (req, res) => {

};

const getBooksBySubject = async (req, res) => {

};

const getBooksBySubjectAndNumber = async (req, res) => {

};

const createBook = async (req, res) => {
  // const { title, isbn, courses } = req.body;

  // const book = new Book({
  //   title,
  //   isbn,
  //   courses,
  // });

  // const createdBook = await book.save();

  // res.status(201).json({
  //   message: 'OK created',
  //   bookId: createdBook._id,
  // });
};

const booksGetHandler = async (req, res) => {
  const { subject, course_num: courseNumber } = req.params;

  if (!subject && !courseNumber) {
    return getAllBooks(req, res);
  } else if (subject && !courseNumber) {
    return getBooksBySubject(req, res);
  } else if (subject && courseNumber) {
    return getBooksBySubjectAndNumber(req, res);
  } else {
    // Here, courseNumber is provided but not subject,
    // so return a 400 error
  }
};

booksRouter.asyncRoute('/')
  .get(booksGetHandler)
  .post(createBook);

/* Begin /books/:id route */

const getBookById = async (req, res) => {

};

booksRouter.asyncRoute('/:id')
  .get(getBookById);

module.exports = router => router.use('/books', booksRouter);
const { Router } = require('express');
const { registerAsyncHandlers } = require('./util');

const booksRouter = Router({ mergeParams: true });
registerAsyncHandlers(booksRouter);

/* Begin /books route */

const getAllBooks = async (req, res) => {

};

const getBooksBySubject = async (req, res) => {

};

const getBooksBySubjectAndNumber = async (req, res) => {

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
  .get(booksGetHandler);

/* Begin /books/:id route */

const getBookById = async (req, res) => {

};

booksRouter.asyncRoute('/:id')
  .get(getBookById);


module.exports = router => router.use('/books', booksRouter);
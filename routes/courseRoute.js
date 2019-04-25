const { Router } = require('express');
const { registerAsyncHandlers } = require('./util');
const Course = require('../models/course');
const Book = require('../models/book');

const coursesRouter = Router({ mergeParams: true });
registerAsyncHandlers(coursesRouter);

/* Begin /courses route */

const getAllCourses = () => Course.find({}).populate({ path: 'books', model: Book, select: '-courses' });

const getCourseBySubjectAndNumber = async (subject, courseNumber) => {
  let query = Course.where('department').equals(subject);
  if (courseNumber) {
    query = query.where('number').equals(courseNumber);
  }
  return query.populate({ path: 'books', model: Book, select: '-courses' });
};

const coursesGetHandler = async (req, res) => {
  const { subject, course_num: courseNumber } = req.query;

  if (!subject && !courseNumber) {
    const courses = await getAllCourses();
    return res.json({ courses });
  } else if (subject) {
    const course = await getCourseBySubjectAndNumber(subject, courseNumber);
    if (!course.length) {
      return res.status(404).json({
        message: 'No course found with the corresponding subject and number.'
      });
    } else {
      return res.json({course});
    }
  } else if (!subject) {
    return res.status(400).json({
      message: 'Missing subject parameter in querystring'
    }); 
  } else {
    return res.status(400).json({
      message: 'Missing courseNumber parameter in querystring'
    });
  }
}

coursesRouter.asyncRoute('/')
  .get(coursesGetHandler);

module.exports = router => router.use('/courses', coursesRouter);
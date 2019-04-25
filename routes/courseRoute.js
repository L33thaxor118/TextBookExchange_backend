const { Router } = require('express');
const { registerAsyncHandlers } = require('./util');
const Course = require('../models/course');

const coursesRouter = Router({ mergeParams: true });
registerAsyncHandlers(coursesRouter);

/* Begin /courses route */

const getAllCourses = () => Course.find({});

const getCourseBySubjectAndNumber = async (subject, courseNumber) => {
  let query = Course.where('department').equals(subject);
  query = query.where('number').equals(courseNumber);
  const course = await query;
  return course;
};

const coursesGetHandler = async (req, res) => {
  const { subject, course_num: courseNumber } = req.query;

  if (!subject && !courseNumber) {
    const courses = await getAllCourses();
    return res.json({ courses });
  } else if (subject && courseNumber) {
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
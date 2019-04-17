const { Router } = require('express');
const { registerAsyncHandlers } = require('./util');

const coursesRouter = Router({ mergeParams: true });
registerAsyncHandlers(coursesRouter);

/* Begin /courses route */

const getAllCourses = async (req, res) => {

};

coursesRouter.asyncRoute('/')
  .get(getAllCourses);

/* Begin /courses/:subject/:course_num route */

const getCourseBySubjectAndNumber = async (req, res) => {
  const { subject, courseNumber } = req.params;
};

coursesRouter.asyncRoute('/:subject/:courseNumber')
  .get(getCourseBySubjectAndNumber);

module.exports = router => router.use('/courses', coursesRouter);
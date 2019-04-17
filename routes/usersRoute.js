const { Router } = require('express');
const { registerAsyncHandlers } = require('./util');
// TODO: Import all required models here

const usersRouter = Router({ mergeParams: true });
// This allows us to use async / await with the route handlers
registerAsyncHandlers(usersRouter);

/* Begin /users route */

// GET /users
const getAllUsers = async (req, res) => {

};

// POST /users
const createNewUser = async (req, res) => {

};

usersRouter.asyncRoute('/')
  .get(getAllUsers)
  .post(createNewUser);

/* Begin /users/:id route */

// GET /users/:id
const getUserById = async (req, res) => {
  const { id } = req.params;
};

// DELETE /users/:id
const deleteUserById = async (req, res) => {
  const { id } = req.params;
};

usersRouter.asyncRoute('/:id')
  .get(getUserById)
  .delete(deleteUserById);

module.exports = router => router.use('/users', usersRouter);
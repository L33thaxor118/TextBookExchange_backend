const { Router } = require('express');
const { registerAsyncHandlers, notFoundMiddleware } = require('./util');
const User = require('../models/user');
const Listing = require('../models/listing');
const Book = require('../models/book')

const usersRouter = Router({ mergeParams: true });
const wrapNotFound = notFoundMiddleware(User, 'firebaseId');

// This allows us to use async / await with the route handlers
registerAsyncHandlers(usersRouter);

/* Begin /users route */

// GET /users
const getAllUsers = async (req, res) => {
  const users = await User.find({});
  res.json({ users });
};

// POST /users
const createNewUser = async (req, res) => {
  const requiredFields = ['firebaseId', 'displayName', 'email'];

  // Check that all required fields are present
  for (let field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({
        message: `Missing required field '${field}'.`
      });
    }
  }

  const user = new User(requiredFields.reduce((acc, field) => {
    acc[field] = req.body[field];
    return acc;
  }, {}));

  await user.save();

  res.status(201).json({ user });
};

usersRouter.asyncRoute('/')
  .get(getAllUsers)
  .post(createNewUser);

/* Begin /users/:id route */

// GET /users/:id
const getUserById = async (req, res, user) => res.json({ user });

// DELETE /users/:id
const deleteUserById = async (req, res, user) => {
  const { id } = req.params;
  const { listings } = user;

  await Promise.all([
    User.deleteOne({ _id: id }),
    ...listings.map(listingId => Listing.findByIdAndDelete(listingId))
  ]);

  res.json({ user });
};

// PUT /users/:id
const updateUserById = async (req, res, user) => {
  const { id } = req.params;
  const { bookIds } = req.body;
  
  // check that books are in the database
  if (bookIds) {
    for (let id of bookIds) {
      const book = await Book.findById(id);
      if (!book) {
        return res.status(400).json({
          message: `Wishlist not valid: no book found with id ${id}.`
      });
      }
    } 
  }

  user['wishlist'] = bookIds;
  await user.save();
  return res.status(200).json({
    message: 'Successfully updated user',
    user: user,
  });

};


usersRouter.asyncRoute('/:id')
  .get(wrapNotFound(getUserById))
  .delete(wrapNotFound(deleteUserById))
  .put(wrapNotFound(updateUserById));

module.exports = router => router.use('/users', usersRouter);
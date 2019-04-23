const { Router } = require('express');
const { registerAsyncHandlers,  notFoundMiddleware} = require('./util');

const Listing = require('../models/listing');
const Book = require('../models/book');
const User = require('../models/user');

const listingsRouter = Router({ mergeParams: true });
registerAsyncHandlers(listingsRouter);

const wrapNotFound = notFoundMiddleware(Listing);

/* Begin /listings route */

const getAllListings = async (req, res) => {
	const listings = await Listing.find({});
	return res.json({listings});
}

const createListing = async (req, res) => {
  const { isbn, condition, userId, price, exchangeBook } = req.body;

  if (![isbn, condition, userId].every(Boolean)) {
	  return res.status(400).json({
      message: 'Missing parameter (isbn, condition or userId) in request body',
    });  
  }

  // Check that at least one of price or exchangeBook is given
  if (!(price || exchangeBook)) {
	  return res.status(400).json({
      message: 'Missing price or exchangeBook parameter in request body',
    });
  }

  // Check that the book exists in the database
  const book = await Book.findOne({isbn: isbn});
  if (!book) {
	  return res.status(400).json({
      message:`No book found with isbn ${isbn}.`
    });
  }

  // Check that user exists in the database
  const user = await User.findOne({firebaseId: userId});
  if (!user) {
	  return res.status(400).json({
      message:`No user found with firebaseId ${userId}.`
    });
  }

  if (price) {
  	if (price < 0) {
      return res.status(400).json({
        message:`Invalid price: must be greater than 0.`
      });
    }
  }

  if (exchangeBook) {
	  // Check that the exchangeBook exists in the database
	  const exBook = await Book.findOne({isbn: exchangeBook});
	  if (!exBook) {
      return res.status(400).json({
        message:`No exchange book found with isbn ${exchangeBook}.`
      });
	  }
  }

  const listing = new Listing({
    isbn: isbn,
    condition: condition,
    price: price,
    exchangeBook: exchangeBook,
    assignedUserId: userId
  });

  const createdListing = await listing.save();

  // Add new listing's id to assigned user's listings list
  user.listings.push(createdListing._id);
  await user.save();

  return res.status(201).json({
    message: 'OK created',
    listing: createdListing
  });
}

listingsRouter.asyncRoute('/')
  .get(getAllListings)
  .post(createListing);

/* Begin /listings/:id route */

const getListingById = (req, res, listing) => res.status(200).json({ listing });

const deleteListingById = async (req, res, listing) => {
  const { id } = req.params;
  const userId = listing.assignedUserId;
  const user = await User.findOne({firebaseId: userId});

  await Listing.deleteOne({_id: id});

  // Remove listing's id from assigned user's listings list
  user.listings.pull(id);
  await user.save();

  res.json({ listing });
};

const updateListingById = async (req, res, listing) => {
  const { id } = req.params; 
  const { price, exchangeBook, statusCompleted } = req.body;

  if (![price, exchangeBook, statusCompleted].some(Boolean)) {
	  return res.status(400).json({
      message: 'No parameter provided in request body',
    });  
  }

  if (price) {
  	if (price < 0) {
		  return res.status(400).json({
        message:`Invalid price: must be greater than 0.`
			});
	  }
  }

  if (exchangeBook) {
	  // Check that the exchangeBook exists in the database
	  const exBook = await Book.findOne({isbn: exchangeBook});
	  if (!exBook) {
		  return res.status(400).json({
        message:`No exchange book found with isbn ${exchangeBook}.`
      });
	  }
  }

  if (statusCompleted) {
  	if (!(statusCompleted === 'true' || statusCompleted === 'false')) {
      return res.status(400).json({
        message:`Invalid statusCompleted: must be a Boolean.`
      });
    }
  }

  if (price) {
  	listing.price = price;
  }

  if (exchangeBook) {
  	listing.exchangeBook = exchangeBook;
  }

  if (statusCompleted) {
  	listing.statusCompleted = statusCompleted;
  }

  const updatedListing = await listing.save();
  res.status(200).json({
    message: 'Successfully updated listing',
    book: updatedListing,
  });
};

listingsRouter.asyncRoute('/:id')
  .get(wrapNotFound(getListingById))
  .put(wrapNotFound(updateListingById))
  .delete(wrapNotFound(deleteListingById));

module.exports = router => router.use('/listings', listingsRouter);
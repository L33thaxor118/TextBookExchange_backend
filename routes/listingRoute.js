const { Router } = require('express');
const { registerAsyncHandlers, notFoundMiddleware } = require('./util');

const Listing = require('../models/listing');
const Book = require('../models/book');
const User = require('../models/user');

const listingsRouter = Router({ mergeParams: true });
registerAsyncHandlers(listingsRouter);

const wrapNotFound = notFoundMiddleware(Listing);

// .populate() is essentially a JOIN operation that mongoose provides
const listingPopulateOpts = [
  { path: 'book', select: '-courses', model: 'Book' },
  { path: 'exchangeBook', select: '-courses', model: 'Book' },
];

const fetchListingAndPopulate = async id => {
  if (id) {
    const listing = await Listing.findById(id)
      .populate(listingPopulateOpts)
      .lean();
    
    const { listings, ...user } = await User.findOne({firebaseId: listing.assignedUser}).lean() || {};

    return {
      ...listing,
      assignedUser: user
    };
  } else {
    const listings = await Listing.find({})
      .populate(listingPopulateOpts)
      .lean();

    return new Promise(async resolve => {
      const joinedListings = [];
      for (let listing of listings) {
        const { listings, ...user } = await User.findOne({firebaseId: listing.assignedUser}).lean();
        joinedListings.push({
          ...listing,
          assignedUser: user,
        });
      }

      resolve(joinedListings);
    });
  }
};

/* Begin /listings route */

const getAllListings = async (req, res) => res.json({ listings: await fetchListingAndPopulate() });

const createListing = async (req, res) => {
  const {
    bookId,
    condition,
    description,
    userId,
    price,
    exchangeBook,
    imageNames,
  } = req.body;

  if (![bookId, condition, userId].every(Boolean)) {
    return res.status(400).json({
      message: 'Missing parameter (bookId, condition or userId) in request body',
    });  
  }

  // Check that at least one of price or exchangeBook is given
  if (!(price || exchangeBook)) {
    return res.status(400).json({
      message: 'Missing price or exchangeBook parameter in request body',
    });
  }

  // Check that the book exists in the database
  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(400).json({
      message: `No book found with id ${bookId}.`
    });
  }

  // Check that user exists in the database
  const user = await User.findOne({ firebaseId: userId });
  if (!user) {
    return res.status(400).json({
      message: `No user found with firebase id ${userId}.`
    });
  }

  if (price && price < 0) {
    return res.status(400).json({
      message: `Invalid price: must be greater than 0.`
    });
  }

  if (exchangeBook) {
    // Check that the exchangeBook exists in the database
    const exBook = await Book.findById(exchangeBook);
    if (!exBook) {
      return res.status(400).json({
        message: `No exchange book found with id ${exchangeBook}.`
      });
    }
  }

  const listing = new Listing({
    book: bookId,
    condition,
    description,
    imageNames,
    price,
    exchangeBook,
    assignedUser: userId
  });

  const { id } = await listing.save();

  // Add new listing's id to assigned user's listings list
  user.listings.push(id);
  await user.save();

  return res.status(201).json({
    message: 'OK created',
    listing: await fetchListingAndPopulate(id),
  });
}

listingsRouter.asyncRoute('/')
  .get(getAllListings)
  .post(createListing);

/* Begin /listings/:id route */

const getListingById = async (req, res) => res.status(200).json({ listing: await fetchListingAndPopulate(req.params.id) });

const deleteListingById = async (req, res, listing) => {
  const { id } = req.params;
  const userId = listing.assignedUser;
  const user = await User.findOne({firebaseId: userId});

  await Listing.deleteOne({_id: id});

  // Remove listing's id from assigned user's listings list
  user.listings.pull(id);
  await user.save();

  res.json({ listing });
};

const updateListingById = async (req, res, listing) => {
  const { id } = req.params;
  const { price, exchangeBook } = req.body;
  const fields = ['price', 'exchangeBook', 'statusCompleted', 'imageNames', 'description'];

  if (!fields.map(f => req.body[f]).some(Boolean)) {
    return res.status(400).json({
      message: 'No parameter provided in request body',
    });  
  }

  if (price && price < 0) {
    return res.status(400).json({
      message:`Invalid price: must be greater than 0.`
    });
  }

  if (exchangeBook) {
    const { exchangeBook } = req.body;
    // Check that the exchangeBook exists in the database
    const exBook = await Book.findById(exchangeBook);
    if (!exBook) {
      return res.status(400).json({
        message:`No exchange book found with id ${exchangeBook}.`
      });
    }
  }

  fields.forEach(field => {
    if (req.body[field]) {
      listing[field] = req.body[field];
    }
  });

  await listing.save();

  res.status(200).json({
    message: 'Successfully updated listing',
    book: await fetchListingAndPopulate(id),
  });
};

listingsRouter.asyncRoute('/:id')
  .get(wrapNotFound(getListingById))
  .put(wrapNotFound(updateListingById))
  .delete(wrapNotFound(deleteListingById));

module.exports = router => router.use('/listings', listingsRouter);
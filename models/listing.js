var mongoose = require('mongoose');

var ListingSchema = new mongoose.Schema({
  bookId: {type: mongoose.Schema.Types.ObjectId, required: true},
  // Book title
  title: {type: String, required: true},
  description: {type: String, default: ''},
  imageNames: [String],
  condition: {
    type: String,
    required: true,
    enum: [
      'new',
      'like new',
      'used - very good',
      'used - good',
      'used - acceptable'
    ]
  },
  price: {type: Number, min: 0, default: 0},
  exchangeBook: {type: String, default: ''},
  statusCompleted: {type: Boolean, default: false},
  dateCreated: {type: Date, default: Date.now},
  assignedUserId: {type: String, required: true} 
}, { versionKey: false });

module.exports = mongoose.model('Listing', ListingSchema);

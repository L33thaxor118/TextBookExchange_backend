var mongoose = require('mongoose');

var ListingSchema = new mongoose.Schema({
  book: {type: mongoose.Schema.Types.ObjectId, required: true},
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
  exchangeBook: mongoose.Schema.Types.ObjectId,
  statusCompleted: {type: Boolean, default: false},
  dateCreated: {type: Date, default: Date.now},
  // Firebase id
  assignedUser: {type: String, required: true} 
}, { versionKey: false });

module.exports = mongoose.model('Listing', ListingSchema);

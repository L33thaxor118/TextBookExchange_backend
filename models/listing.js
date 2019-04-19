var mongoose = require('mongoose');

var ListingSchema = new mongoose.Schema({
	isbn: {type: String, required: true},
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

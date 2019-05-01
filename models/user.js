var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  firebaseId: {type: String, unique: true, required: true},
  displayName: {type: String, unique: true, required: true},
  email: {type: String, unique: true, required: true},
  listings: {type: [String], default: []},
  wishlist: {type:[mongoose.Schema.Types.ObjectId],default:[]}
}, { versionKey: false });

module.exports = mongoose.model('User', UserSchema);

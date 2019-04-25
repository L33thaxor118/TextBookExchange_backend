var mongoose = require('mongoose');

var BookSchema = new mongoose.Schema({
  title: {type: String, required: true},
  authors: {type: [String], required: true},
  isbn: {type: String, required: true, unique: true},
  courses: [mongoose.Schema.Types.ObjectId],
}, { versionKey: false });

module.exports = mongoose.model('Book', BookSchema);

var mongoose = require('mongoose');

var CourseSchema = new mongoose.Schema({
  department: {type: String, required: true},
  number: {type: String, required: true},
  title: {type: String, required: true},
  // Books should be a list of MongoIDs
  books: {type: [String], default: []},
}, { versionKey: false });

module.exports = mongoose.model('Course', CourseSchema);

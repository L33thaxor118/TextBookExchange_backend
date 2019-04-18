var mongoose = require('mongoose');

var CourseSchema = new mongoose.Schema({
  department: {type: String, required: true},
  number: {type: String, required: true},
  title: {type: String, required: true},
  books: {type: [String], default: []},
}, { versionKey: false });

module.exports = mongoose.model('Course', CourseSchema);

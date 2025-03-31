// models/Committee.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommitteeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  formationDate: {
    type: Date,
    required: true
  },
  specificationSubmissionDate: {
    type: Date,
    required: true
  },
  reviewDate: {
    type: Date,
    required: true
  },
  schedule: {
    type: String
  },
  members: [{
    name: String,
    role: String,
    email: String
  }],
  formationLetter: {
    filename: String,
    path: String,
    originalname: String,
    mimetype: String,
    size: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Committee', CommitteeSchema);
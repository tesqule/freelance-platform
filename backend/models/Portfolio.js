const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  freelancer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  imageUrl:     { type: String, default: '' },
  projectUrl:   { type: String, default: '' },
  category:     { type: String, default: 'other' },
  skills:       [{ type: String }],
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
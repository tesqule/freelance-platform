const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  freelancer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  imageUrl:     { type: String, default: '' },
  category:     { type: String, default: 'other' },
  price:        { type: Number, required: true, min: 1 },
  deliveryDays: { type: Number, required: true, min: 1 },
  skills:       [{ type: String }],
  isActive:     { type: Boolean, default: true },
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
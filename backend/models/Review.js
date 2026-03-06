const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  task:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: false, default: null },
  reviewer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Уникальность: один отзыв на задание от одного пользователя (только если task не null)
// Для прямых отзывов (task=null) — один от reviewer на reviewee
reviewSchema.index(
  { task: 1, reviewer: 1 },
  { unique: true, partialFilterExpression: { task: { $type: 'objectId' } } }
);
reviewSchema.index(
  { reviewer: 1, reviewee: 1, task: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Review', reviewSchema);
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  task:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: false, default: null },
  reviewer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Только для отзывов с заданием — один отзыв от reviewer на task
reviewSchema.index(
  { task: 1, reviewer: 1 },
  { unique: true, partialFilterExpression: { task: { $type: 'objectId' } } }
);

// Для прямых отзывов (task=null) проверка дублей идёт в route-коде, не индексом

module.exports = mongoose.model('Review', reviewSchema);
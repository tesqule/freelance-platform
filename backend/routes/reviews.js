const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Task = require('../models/Task');
const User = require('../models/User');

// Дропаем старый проблемный индекс при старте (один раз)
Review.collection.dropIndex('reviewer_1_reviewee_1_task_1').catch(() => {});

// POST /api/reviews
router.post('/', auth, async (req, res) => {
  try {
    const { taskId, revieweeId, rating, comment } = req.body;

    if (!revieweeId || !rating) {
      return res.status(400).json({ message: 'revieweeId and rating are required' });
    }
    if (req.user._id.toString() === revieweeId) {
      return res.status(400).json({ message: 'Cannot review yourself' });
    }

    if (taskId) {
      // Отзыв привязан к заданию
      const task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });
      const isClient     = task.client.toString() === req.user._id.toString();
      const isFreelancer = task.assignedTo?.toString() === req.user._id.toString();
      if (!isClient && !isFreelancer) {
        return res.status(403).json({ message: 'Not authorized for this task' });
      }
      const existing = await Review.findOne({ task: taskId, reviewer: req.user._id });
      if (existing) return res.status(400).json({ message: 'You already left a review for this task' });
    } else {
      // Прямой отзыв на профиль — один от reviewer на reviewee
      const existing = await Review.findOne({
        reviewer: req.user._id,
        reviewee: revieweeId,
        task: null
      });
      if (existing) return res.status(400).json({ message: 'You already left a review for this user' });
    }

    const review = new Review({
      task:     taskId || null,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating,
      comment
    });
    await review.save();

    // Пересчёт рейтинга
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avgRating  = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(revieweeId, {
      rating:      Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length
    });

    const populated = await Review.findById(review._id).populate('reviewer', 'name avatar role');
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Review already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reviews/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar role')
      .populate('task', 'title')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/reviews/task/:taskId
router.get('/task/:taskId', async (req, res) => {
  try {
    const reviews = await Review.find({ task: req.params.taskId })
      .populate('reviewer', 'name avatar role')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
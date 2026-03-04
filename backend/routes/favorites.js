const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Favorite = require('../models/Favorite');

// GET /api/favorites — мои избранные задания
router.get('/', auth, async (req, res) => {
  try {
    const favs = await Favorite.find({ user: req.user._id })
      .populate({
        path: 'task',
        populate: { path: 'client', select: 'name avatar rating' }
      })
      .sort({ createdAt: -1 });
    // Возвращаем только задания (без обёртки)
    res.json(favs.map(f => ({ ...f.task.toObject(), favoriteId: f._id })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/favorites/:taskId — добавить в избранное
router.post('/:taskId', auth, async (req, res) => {
  try {
    const fav = new Favorite({ user: req.user._id, task: req.params.taskId });
    await fav.save();
    res.status(201).json({ message: 'Added to favorites', id: fav._id });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Already in favorites' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/favorites/:taskId — убрать из избранного
router.delete('/:taskId', auth, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ user: req.user._id, task: req.params.taskId });
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/favorites/check/:taskId — проверить, в избранном ли
router.get('/check/:taskId', auth, async (req, res) => {
  try {
    const fav = await Favorite.findOne({ user: req.user._id, task: req.params.taskId });
    res.json({ isFavorite: !!fav });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
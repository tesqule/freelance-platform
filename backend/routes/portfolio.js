const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');

// GET /api/portfolio/:userId — портфолио пользователя
router.get('/:userId', async (req, res) => {
  try {
    const items = await Portfolio.find({ freelancer: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/portfolio — добавить работу
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can add portfolio items' });
    }
    const { title, description, imageUrl, projectUrl, category, skills } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const item = new Portfolio({
      freelancer: req.user._id,
      title, description, imageUrl, projectUrl,
      category: category || 'other',
      skills: skills || []
    });
    await item.save();

    // Добавляем ссылку в профиль
    await User.findByIdAndUpdate(req.user._id, { $push: { portfolio: item._id } });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/portfolio/:id — обновить работу
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Portfolio.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Portfolio item not found' });
    if (item.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { title, description, imageUrl, projectUrl, category, skills } = req.body;
    Object.assign(item, { title, description, imageUrl, projectUrl, category, skills });
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/portfolio/:id — удалить работу
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Portfolio.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (item.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await item.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $pull: { portfolio: item._id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
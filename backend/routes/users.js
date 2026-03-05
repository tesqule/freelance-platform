const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// ⚠️ ВАЖНО: /profile/update должен быть ПЕРВЫМ, до /:id
router.put('/profile/update', auth, async (req, res) => {
  try {
    const { name, bio, skills, avatar, telegramChatId, emailNotifications } = req.body;
    
    const updateData = { name, bio, skills, avatar };
    if (telegramChatId !== undefined) updateData.telegramChatId = telegramChatId;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// Get users list
router.get('/', async (req, res) => {
  try {
    const { role, skill, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (skill) query.skills = { $in: [skill] };
    if (search) query.name = { $regex: search, $options: 'i' };

    const users = await User.find(query).select('-password').sort({ rating: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
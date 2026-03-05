const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

router.get('/', auth, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifs);
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ count });
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/read/all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ ok: true });
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/all', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ ok: true });
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
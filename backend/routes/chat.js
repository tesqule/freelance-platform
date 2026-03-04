const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

// Get messages for a room
router.get('/:room', auth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark as read
    await Message.updateMany(
      { room: req.params.room, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all conversations for user
router.get('/conversations/list', auth, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const rooms = await Message.aggregate([
      {
        $match: {
          $or: [
            { room: { $regex: userId } }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$room',
          lastMessage: { $first: '$text' },
          lastDate: { $first: '$createdAt' },
          lastSender: { $first: '$sender' }
        }
      },
      { $sort: { lastDate: -1 } }
    ]);

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
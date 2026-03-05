const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Proposal = require('../models/Proposal');
const User = require('../models/User');
const Notification = require('../models/Notification');
const notify = require('../utils/notify');

async function createNotification(userId, text, icon = '🔔', link = '') {
  try {
    await Notification.create({ user: userId, text, icon, link });
  } catch(e) {
    console.error('Notification error:', e.message);
  }
}

router.get('/my/tasks', auth, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'client') {
      tasks = await Task.find({ client: req.user._id })
        .populate('assignedTo', 'name avatar rating')
        .populate('proposals')
        .sort({ createdAt: -1 });
    } else {
      const myProposals = await Proposal.find({ freelancer: req.user._id }).select('task');
      const taskIds = myProposals.map(p => p.task);
      tasks = await Task.find({
        $or: [{ assignedTo: req.user._id }, { _id: { $in: taskIds } }]
      })
        .populate('client', 'name avatar rating')
        .sort({ createdAt: -1 });
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, minBudget, maxBudget, status, search } = req.query;
    let query = {};
    if (category) query.category = category;
    query.status = status || 'open';
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const tasks = await Task.find(query)
      .populate('client', 'name avatar rating')
      .populate('proposals')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('client', 'name avatar rating bio completedTasks')
      .populate({
        path: 'proposals',
        populate: { path: 'freelancer', select: 'name avatar rating completedTasks skills' }
      });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can create tasks' });
    }
    const { title, description, category, budget, deadline, skills } = req.body;
    const task = new Task({
      title, description, category, budget, deadline,
      skills: skills || [],
      client: req.user._id
    });
    await task.save();
    const populated = await Task.findById(task._id).populate('client', 'name avatar rating');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/proposals', auth, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can submit proposals' });
    }
    const task = await Task.findById(req.params.id).populate('client');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.status !== 'open') return res.status(400).json({ message: 'Task is not open' });

    const existing = await Proposal.findOne({ task: task._id, freelancer: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already submitted a proposal' });

    const { coverLetter, price, deliveryDays } = req.body;
    const proposal = new Proposal({ task: task._id, freelancer: req.user._id, coverLetter, price, deliveryDays });
    await proposal.save();
    task.proposals.push(proposal._id);
    await task.save();

    const clientId = task.client._id || task.client;
    await createNotification(
      clientId,
      `💼 ${req.user.name} откликнулся на задание «${task.title}»`,
      '💼',
      `task-detail.html?id=${task._id}`
    );

    const client = await User.findById(clientId);
    if (client) notify.notifyNewProposal(client, task, req.user).catch(console.error);

    const populated = await Proposal.findById(proposal._id)
      .populate('freelancer', 'name avatar rating completedTasks skills');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/:taskId/proposals/:proposalId/accept', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const proposal = await Proposal.findById(req.params.proposalId);
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

    proposal.status = 'accepted';
    await proposal.save();
    task.status = 'in_progress';
    task.assignedTo = proposal.freelancer;
    await task.save();
    await Proposal.updateMany(
      { task: task._id, _id: { $ne: proposal._id } },
      { status: 'rejected' }
    );

    await createNotification(
      proposal.freelancer,
      `✅ Ваш отклик на задание «${task.title}» принят!`,
      '✅',
      `task-detail.html?id=${task._id}`
    );

    const freelancer = await User.findById(proposal.freelancer);
    if (freelancer) notify.notifyProposalAccepted(freelancer, task).catch(console.error);

    res.json({ message: 'Proposal accepted', task, proposal });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/:taskId/proposals/:proposalId/reject', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const proposal = await Proposal.findById(req.params.proposalId);
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    proposal.status = 'rejected';
    await proposal.save();

    await createNotification(
      proposal.freelancer,
      `❌ Ваш отклик на задание «${task.title}» отклонён`,
      '❌',
      `task-detail.html?id=${task._id}`
    );

    res.json({ message: 'Proposal rejected', proposal });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    task.status = 'completed';
    await task.save();

    if (task.assignedTo) {
      await User.findByIdAndUpdate(task.assignedTo, { $inc: { completedTasks: 1 } });

      await createNotification(
        task.assignedTo,
        `🎉 Задание «${task.title}» отмечено как выполненное!`,
        '🎉',
        `task-detail.html?id=${task._id}`
      );

      const freelancer = await User.findById(task.assignedTo);
      if (freelancer) notify.notifyTaskCompleted(freelancer, task).catch(console.error);
    }
    res.json({ message: 'Task completed', task });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
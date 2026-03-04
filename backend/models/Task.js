const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['design', 'development', 'writing', 'marketing', 'video', 'music', 'other'],
    required: true
  },
  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  skills: [{ type: String }],
  attachments: [{ type: String }],
  proposals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
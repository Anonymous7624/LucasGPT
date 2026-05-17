const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'lucas'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000
  },
  file_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ conversation_id: 1, created_at: 1 });

module.exports = mongoose.model('Message', messageSchema);

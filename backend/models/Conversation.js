const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  owner_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  guest_session_id: {
    type: String,
    default: null
  },
  display_name: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'answered', 'closed'],
    default: 'open'
  },
  is_guest: {
    type: Boolean,
    default: false
  },
  last_heartbeat_at: {
    type: Date,
    default: Date.now
  },
  closed_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

conversationSchema.index({ owner_user_id: 1, updated_at: -1 });
conversationSchema.index({ guest_session_id: 1 });
conversationSchema.index({ updated_at: -1 });
conversationSchema.index({ is_guest: 1, last_heartbeat_at: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);

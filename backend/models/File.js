const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  gridfs_file_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  original_name: {
    type: String,
    required: true
  },
  mime_type: {
    type: String,
    required: true
  },
  size_bytes: {
    type: Number,
    required: true
  },
  uploaded_by: {
    type: String,
    enum: ['user', 'guest', 'admin'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

fileSchema.index({ conversation_id: 1 });
fileSchema.index({ message_id: 1 });
fileSchema.index({ gridfs_file_id: 1 });

module.exports = mongoose.model('File', fileSchema);

const express = require('express');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const File = require('../models/File');
const { getGridFSBucket } = require('../db');

const router = express.Router();

const guestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many guest sessions created. Please try again later.' }
});

router.post('/start', guestLimiter, async (req, res) => {
  try {
    const guestSessionId = uuidv4();

    const conversation = new Conversation({
      guest_session_id: guestSessionId,
      is_guest: true,
      status: 'open',
      last_heartbeat_at: new Date()
    });

    await conversation.save();

    res.json({
      guestSessionId,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Error starting guest session:', error);
    res.status(500).json({ error: 'Failed to start guest session' });
  }
});

router.post('/:guestSessionId/heartbeat', async (req, res) => {
  try {
    const { guestSessionId } = req.params;

    const conversation = await Conversation.findOne({ guest_session_id: guestSessionId });

    if (!conversation) {
      return res.status(404).json({ error: 'Guest session not found' });
    }

    conversation.last_heartbeat_at = new Date();
    await conversation.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

router.post('/:guestSessionId/end', async (req, res) => {
  try {
    const { guestSessionId } = req.params;

    const conversations = await Conversation.find({ guest_session_id: guestSessionId });

    if (conversations.length === 0) {
      return res.json({ success: true, message: 'No conversations found' });
    }

    const conversationIds = conversations.map(c => c._id);

    const messages = await Message.find({ conversation_id: { $in: conversationIds } });
    const messageIds = messages.map(m => m._id);

    const files = await File.find({ conversation_id: { $in: conversationIds } });

    const gfsBucket = getGridFSBucket();
    for (const file of files) {
      try {
        await gfsBucket.delete(file.gridfs_file_id);
      } catch (err) {
        console.error(`Error deleting GridFS file ${file.gridfs_file_id}:`, err);
      }
    }

    await File.deleteMany({ conversation_id: { $in: conversationIds } });
    await Message.deleteMany({ conversation_id: { $in: conversationIds } });
    await Conversation.deleteMany({ guest_session_id: guestSessionId });

    console.log(`Guest session ${guestSessionId} ended: ${conversations.length} conversations, ${messages.length} messages, ${files.length} files deleted`);

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending guest session:', error);
    res.status(500).json({ error: 'Failed to end guest session' });
  }
});

module.exports = router;

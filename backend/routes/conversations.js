const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const publicMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many messages. Please wait a moment.' }
});

router.post('/', (req, res) => {
  try {
    const { displayName } = req.body;
    const conversationId = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO conversations (id, display_name, status, created_at, updated_at)
      VALUES (?, ?, 'open', ?, ?)
    `);

    stmt.run(conversationId, displayName || null, now, now);

    res.json({ conversationId });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/:conversationId/messages', (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC
    `).all(conversationId);

    res.json({ conversation, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:conversationId/messages', publicMessageLimiter, (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
    }

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messageId = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO messages (id, conversation_id, sender, content, created_at)
      VALUES (?, ?, 'user', ?, ?)
    `);

    stmt.run(messageId, conversationId, content.trim(), now);

    const updateStmt = db.prepare(`
      UPDATE conversations SET updated_at = ?, status = 'open' WHERE id = ?
    `);
    updateStmt.run(now, conversationId);

    const message = {
      id: messageId,
      conversation_id: conversationId,
      sender: 'user',
      content: content.trim(),
      created_at: now
    };

    res.json({ message });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

router.get('/admin/conversations', authenticateToken, (req, res) => {
  try {
    const conversations = db.prepare(`
      SELECT 
        c.*,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender = 'user') as user_message_count,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender = 'lucas') as lucas_message_count
      FROM conversations c
      ORDER BY c.updated_at DESC
    `).all();

    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/admin/conversations/:conversationId', authenticateToken, (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC
    `).all(conversationId);

    res.json({ conversation, messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.post('/admin/conversations/:conversationId/reply', authenticateToken, (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Reply content required' });
    }

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messageId = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO messages (id, conversation_id, sender, content, created_at)
      VALUES (?, ?, 'lucas', ?, ?)
    `);

    stmt.run(messageId, conversationId, content.trim(), now);

    const updateStmt = db.prepare(`
      UPDATE conversations SET updated_at = ?, status = 'answered' WHERE id = ?
    `);
    updateStmt.run(now, conversationId);

    const message = {
      id: messageId,
      conversation_id: conversationId,
      sender: 'lucas',
      content: content.trim(),
      created_at: now
    };

    res.json({ message });
  } catch (error) {
    console.error('Error posting reply:', error);
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

router.patch('/admin/conversations/:conversationId/status', authenticateToken, (req, res) => {
  try {
    const { conversationId } = req.params;
    const { status } = req.body;

    if (!['open', 'answered', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be open, answered, or closed' });
    }

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE conversations SET status = ?, updated_at = ? WHERE id = ?
    `);

    stmt.run(status, now, conversationId);

    res.json({ success: true, status });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;

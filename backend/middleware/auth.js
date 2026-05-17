const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password_hash');
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password_hash');
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.log('Optional auth: Invalid token provided');
    }
  }
  
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

async function validateConversationAccess(req, res, next) {
  try {
    const conversationId = req.params.conversationId || req.params.id;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isOwner = req.user && conversation.owner_user_id && 
                   conversation.owner_user_id.toString() === req.user._id.toString();
    
    const isMatchingGuest = conversation.is_guest && 
                           req.headers['x-guest-session-id'] === conversation.guest_session_id;
    
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isMatchingGuest && !isAdmin) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    req.conversation = conversation;
    next();
  } catch (error) {
    console.error('Error validating conversation access:', error);
    return res.status(500).json({ error: 'Failed to validate access' });
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  validateConversationAccess
};


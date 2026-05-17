const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const File = require('../models/File');
const { authenticateToken, optionalAuth, validateConversationAccess } = require('../middleware/auth');
const { getGridFSBucket } = require('../db');
const { Readable } = require('stream');

const router = express.Router();

const publicMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many messages. Please wait a moment.' }
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images (JPEG, PNG, WebP, GIF) are allowed.'));
    }
  }
});

async function checkTotalStorageLimit() {
  const files = await File.find();
  const totalBytes = files.reduce((sum, file) => sum + file.size_bytes, 0);
  return {
    totalBytes,
    limit: parseInt(process.env.MAX_TOTAL_UPLOAD_BYTES || '10737418240'),
    available: parseInt(process.env.MAX_TOTAL_UPLOAD_BYTES || '10737418240') - totalBytes
  };
}

async function uploadFileToGridFS(fileBuffer, filename, mimetype) {
  const gfsBucket = getGridFSBucket();
  const readableStream = Readable.from(fileBuffer);
  
  return new Promise((resolve, reject) => {
    const uploadStream = gfsBucket.openUploadStream(filename, {
      contentType: mimetype
    });

    readableStream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve(uploadStream.id);
      });
  });
}

router.post('/', authenticateToken, async (req, res) => {
  try {
    const conversation = new Conversation({
      owner_user_id: req.user._id,
      is_guest: false,
      status: 'open'
    });

    await conversation.save();

    res.json({ conversationId: conversation._id });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      owner_user_id: req.user._id,
      status: { $in: ['open', 'answered'] }
    }).sort({ updated_at: -1 });

    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({ conversation_id: conv._id })
          .sort({ created_at: -1 });
        
        const fileCount = await File.countDocuments({ conversation_id: conv._id });

        return {
          ...conv.toObject(),
          last_message: lastMessage ? lastMessage.content : null,
          file_count: fileCount
        };
      })
    );

    res.json({ conversations: conversationsWithMessages });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/:conversationId/messages', validateConversationAccess, async (req, res) => {
  try {
    const messages = await Message.find({
      conversation_id: req.conversation._id
    })
      .sort({ created_at: 1 })
      .populate('file_ids');

    res.json({
      conversation: req.conversation,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:conversationId/messages', optionalAuth, publicMessageLimiter, upload.array('files', 20), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const files = req.files || [];

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content required' });
    }

    if (content.length > 50000) {
      return res.status(400).json({ error: 'Message too long (max 50000 characters)' });
    }

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.status === 'closed') {
      return res.status(403).json({ error: 'This conversation is closed' });
    }

    const guestSessionId = req.headers['x-guest-session-id'];
    const isOwner = req.user && conversation.owner_user_id && 
                    conversation.owner_user_id.toString() === req.user._id.toString();
    const isGuest = conversation.is_guest && conversation.guest_session_id === guestSessionId;
    const isAdmin = req.user && req.user.role === 'admin';

    console.log('Message access check:', {
      conversationId,
      userId: req.user?._id?.toString(),
      guestSessionId,
      conversationOwnerId: conversation.owner_user_id?.toString(),
      conversationGuestSessionId: conversation.guest_session_id,
      isOwner,
      isGuest,
      isAdmin
    });

    if (!isOwner && !isGuest && !isAdmin) {
      console.log('Access denied:', {
        conversationId,
        userId: req.user?._id?.toString(),
        guestSessionId,
        conversationOwnerId: conversation.owner_user_id?.toString(),
        conversationGuestSessionId: conversation.guest_session_id
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    if (files.length > 0) {
      const storage = await checkTotalStorageLimit();
      const uploadSize = files.reduce((sum, f) => sum + f.size, 0);

      if (uploadSize > storage.available) {
        return res.status(413).json({
          error: `Upload would exceed storage limit. Available: ${(storage.available / 1024 / 1024).toFixed(2)} MB`
        });
      }
    }

    const message = new Message({
      conversation_id: conversation._id,
      sender: 'user',
      content: content.trim(),
      file_ids: []
    });

    await message.save();

    const fileIds = [];
    for (const file of files) {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const gridfsFileId = await uploadFileToGridFS(file.buffer, sanitizedName, file.mimetype);

      const fileDoc = new File({
        gridfs_file_id: gridfsFileId,
        conversation_id: conversation._id,
        message_id: message._id,
        original_name: sanitizedName,
        mime_type: file.mimetype,
        size_bytes: file.size,
        uploaded_by: conversation.is_guest ? 'guest' : 'user'
      });

      await fileDoc.save();
      fileIds.push(fileDoc._id);
    }

    message.file_ids = fileIds;
    await message.save();

    if (conversation.status === 'answered') {
      conversation.status = 'open';
    }
    conversation.updated_at = new Date();
    if (conversation.is_guest) {
      conversation.last_heartbeat_at = new Date();
    }
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('file_ids');

    res.json({ message: populatedMessage });
  } catch (error) {
    console.error('Error posting message:', error);
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to post message' });
  }
});

module.exports = router;


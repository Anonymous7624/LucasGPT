const express = require('express');
const multer = require('multer');
const path = require('path');
const { Readable } = require('stream');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const File = require('../models/File');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getGridFSBucket } = require('../db');

const router = express.Router();

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

router.get('/conversations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate('owner_user_id', 'username email')
      .sort({ updated_at: -1 });

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({ conversation_id: conv._id })
          .sort({ created_at: -1 });
        
        const fileCount = await File.countDocuments({ conversation_id: conv._id });
        
        const userMessageCount = await Message.countDocuments({
          conversation_id: conv._id,
          sender: 'user'
        });

        const lucasMessageCount = await Message.countDocuments({
          conversation_id: conv._id,
          sender: 'lucas'
        });

        return {
          ...conv.toObject(),
          last_message: lastMessage ? lastMessage.content : null,
          file_count: fileCount,
          user_message_count: userMessageCount,
          lucas_message_count: lucasMessageCount
        };
      })
    );

    res.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:conversationId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('owner_user_id', 'username email');
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation_id: conversationId })
      .sort({ created_at: 1 })
      .populate('file_ids');

    res.json({ conversation, messages });
  } catch (error) {
    console.error('Error fetching admin conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.post('/conversations/:conversationId/reply', authenticateToken, requireAdmin, upload.array('files', 20), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const files = req.files || [];

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Reply content required' });
    }

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
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

    const fileIds = [];
    for (const file of files) {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const gridfsFileId = await uploadFileToGridFS(file.buffer, sanitizedName, file.mimetype);

      const fileDoc = new File({
        gridfs_file_id: gridfsFileId,
        conversation_id: conversation._id,
        original_name: sanitizedName,
        mime_type: file.mimetype,
        size_bytes: file.size,
        uploaded_by: 'admin'
      });

      await fileDoc.save();
      fileIds.push(fileDoc._id);
    }

    const message = new Message({
      conversation_id: conversation._id,
      sender: 'lucas',
      content: content.trim(),
      file_ids: fileIds
    });

    await message.save();

    conversation.status = 'answered';
    conversation.updated_at = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('file_ids');

    res.json({ message: populatedMessage });
  } catch (error) {
    console.error('Error posting admin reply:', error);
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

router.patch('/conversations/:conversationId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { status } = req.body;

    if (!['open', 'answered', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be open, answered, or closed' });
    }

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    conversation.status = status;
    conversation.updated_at = new Date();
    await conversation.save();

    res.json({ success: true, status });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;

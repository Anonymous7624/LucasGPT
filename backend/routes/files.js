const express = require('express');
const File = require('../models/File');
const Conversation = require('../models/Conversation');
const { optionalAuth } = require('../middleware/auth');
const { getGridFSBucket } = require('../db');

const router = express.Router();

async function checkFileAccess(fileId, req) {
  const file = await File.findById(fileId);
  
  if (!file) {
    return { authorized: false, error: 'File not found' };
  }

  const conversation = await Conversation.findById(file.conversation_id);
  
  if (!conversation) {
    return { authorized: false, error: 'Conversation not found' };
  }

  const isAdmin = req.user && req.user.role === 'admin';
  
  if (conversation.status === 'closed' && !isAdmin) {
    return { authorized: false, error: 'Access denied - conversation is closed' };
  }

  const guestSessionId = req.headers['x-guest-session-id'];
  const isGuest = conversation.is_guest && conversation.guest_session_id === guestSessionId;
  const isOwner = req.user && conversation.owner_user_id && 
                  conversation.owner_user_id.toString() === req.user._id.toString();

  if (isGuest || isOwner || isAdmin) {
    return { authorized: true, file };
  }

  return { authorized: false, error: 'Access denied' };
}

router.get('/:fileId/view', optionalAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const access = await checkFileAccess(fileId, req);

    if (!access.authorized) {
      return res.status(403).json({ error: access.error });
    }

    const file = access.file;
    const gfsBucket = getGridFSBucket();

    res.set('Content-Type', file.mime_type);
    res.set('Content-Disposition', `inline; filename="${file.original_name}"`);

    const downloadStream = gfsBucket.openDownloadStream(file.gridfs_file_id);

    downloadStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(404).json({ error: 'File not found in storage' });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error viewing file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to view file' });
    }
  }
});

router.get('/:fileId/download', optionalAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const access = await checkFileAccess(fileId, req);

    if (!access.authorized) {
      return res.status(403).json({ error: access.error });
    }

    const file = access.file;
    const gfsBucket = getGridFSBucket();

    res.set('Content-Type', file.mime_type);
    res.set('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.set('Content-Length', file.size_bytes.toString());

    const downloadStream = gfsBucket.openDownloadStream(file.gridfs_file_id);

    downloadStream.on('error', (error) => {
      console.error('Error downloading file:', error);
      if (!res.headersSent) {
        res.status(404).json({ error: 'File not found in storage' });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download file' });
    }
  }
});

module.exports = router;

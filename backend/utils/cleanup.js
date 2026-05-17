const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const File = require('../models/File');
const { getGridFSBucket } = require('../db');

async function cleanupExpiredGuestSessions() {
  try {
    const timeoutMinutes = parseInt(process.env.GUEST_TIMEOUT_MINUTES || '5');
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const expiredConversations = await Conversation.find({
      is_guest: true,
      last_heartbeat_at: { $lt: cutoffTime }
    });

    if (expiredConversations.length === 0) {
      return;
    }

    const conversationIds = expiredConversations.map(c => c._id);
    
    const messages = await Message.find({ conversation_id: { $in: conversationIds } });
    const files = await File.find({ conversation_id: { $in: conversationIds } });

    const gfsBucket = getGridFSBucket();
    let deletedFilesCount = 0;
    
    for (const file of files) {
      try {
        await gfsBucket.delete(file.gridfs_file_id);
        deletedFilesCount++;
      } catch (err) {
        console.error(`Error deleting GridFS file ${file.gridfs_file_id}:`, err);
      }
    }

    await File.deleteMany({ conversation_id: { $in: conversationIds } });
    await Message.deleteMany({ conversation_id: { $in: conversationIds } });
    await Conversation.deleteMany({ _id: { $in: conversationIds } });

    console.log(`✓ Cleanup: Deleted ${expiredConversations.length} expired guest conversations, ${messages.length} messages, ${deletedFilesCount} files`);
  } catch (error) {
    console.error('Error during guest cleanup:', error);
  }
}

function startCleanupJob() {
  const intervalMinutes = 1;
  console.log(`✓ Guest cleanup job started (runs every ${intervalMinutes} minute(s))`);
  
  setInterval(cleanupExpiredGuestSessions, intervalMinutes * 60 * 1000);
  
  setTimeout(cleanupExpiredGuestSessions, 5000);
}

module.exports = {
  cleanupExpiredGuestSessions,
  startCleanupJob
};

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    display_name TEXT,
    status TEXT DEFAULT 'open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(conversation_id, created_at)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_conversations_updated 
  ON conversations(updated_at DESC)
`);

console.log('Database initialized successfully');

module.exports = db;

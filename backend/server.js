require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET || !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  console.error('ERROR: Missing required environment variables!');
  console.error('Please create a .env file based on .env.example');
  process.exit(1);
}

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LucasGPT API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 LucasGPT Backend running on port ${PORT}`);
  console.log(`📡 Accepting requests from: ${process.env.FRONTEND_ORIGIN}`);
  console.log(`👤 Admin username: ${process.env.ADMIN_USERNAME}\n`);
});

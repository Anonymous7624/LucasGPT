require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { connectDB } = require('./db');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const guestRoutes = require('./routes/guest');
const conversationRoutes = require('./routes/conversations');
const adminRoutes = require('./routes/admin');
const fileRoutes = require('./routes/files');
const { startCleanupJob } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET || !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.MONGODB_URI) {
  console.error('ERROR: Missing required environment variables!');
  console.error('Please create a .env file based on .env.example');
  console.error('Required: MONGODB_URI, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD');
  process.exit(1);
}

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LucasGPT API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function initializeAdmin() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    let admin = await User.findOne({ username: adminUsername });

    const password_hash = await bcrypt.hash(adminPassword, 10);

    if (admin) {
      admin.password_hash = password_hash;
      admin.role = 'admin';
      await admin.save();
      console.log(`✓ Admin account updated: ${adminUsername}`);
    } else {
      admin = new User({
        username: adminUsername,
        password_hash,
        role: 'admin'
      });
      await admin.save();
      console.log(`✓ Admin account created: ${adminUsername}`);
    }
  } catch (error) {
    console.error('Error initializing admin account:', error);
    process.exit(1);
  }
}

async function startServer() {
  try {
    await connectDB();
    
    await initializeAdmin();
    
    startCleanupJob();

    app.listen(PORT, () => {
      console.log(`\n🚀 LucasGPT Backend running on port ${PORT}`);
      console.log(`📡 Accepting requests from: ${process.env.FRONTEND_ORIGIN}`);
      console.log(`👤 Admin username: ${process.env.ADMIN_USERNAME}`);
      console.log(`📦 Max storage: ${(parseInt(process.env.MAX_TOTAL_UPLOAD_BYTES || '10737418240') / 1024 / 1024 / 1024).toFixed(2)} GB`);
      console.log(`⏱️  Guest timeout: ${process.env.GUEST_TIMEOUT_MINUTES || 5} minutes\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();


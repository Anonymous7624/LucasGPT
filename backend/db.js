const mongoose = require('mongoose');
const { MongoClient, GridFSBucket } = require('mongodb');

let gfsBucket;
let mongoClient;

async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected via Mongoose');

    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    
    const db = mongoClient.db();
    gfsBucket = new GridFSBucket(db, {
      bucketName: 'uploads'
    });
    
    console.log('✓ GridFS bucket initialized');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

function getGridFSBucket() {
  if (!gfsBucket) {
    throw new Error('GridFS bucket not initialized. Call connectDB() first.');
  }
  return gfsBucket;
}

async function closeDB() {
  try {
    await mongoose.connection.close();
    if (mongoClient) {
      await mongoClient.close();
    }
    console.log('MongoDB connections closed');
  } catch (error) {
    console.error('Error closing MongoDB connections:', error);
  }
}

module.exports = {
  connectDB,
  getGridFSBucket,
  closeDB
};


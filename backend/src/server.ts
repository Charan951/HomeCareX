import dotenv from 'dotenv';
dotenv.config(); // Must be at the very top!

import http from 'http';
import app from './app';
import mongoose from 'mongoose';

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL as string);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`HomeCareX server running on port ${PORT}`);
  });
});
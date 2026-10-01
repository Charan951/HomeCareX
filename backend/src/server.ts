import 'dotenv/config'; // must run before ./app is evaluated so env-based config (CORS etc.) is picked up
import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import { initSockets } from './sockets';
import { registerEarningsListeners } from './modules/earnings/earnings.listener';

const server = http.createServer(app);
initSockets(server);
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
  registerEarningsListeners();
  server.listen(PORT, () => {
    console.log(`HomeCareX server running on port ${PORT}`);
  });
});
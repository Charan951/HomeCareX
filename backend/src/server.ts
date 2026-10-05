import 'dotenv/config'; // must run before ./app is evaluated so env-based config (CORS etc.) is picked up
import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import { initSockets } from './sockets';
import { registerEarningsListeners } from './modules/earnings/earnings.listener';
import { seedDefaultSettings } from './modules/settings/settings.service';
import { seedDefaultDesignations } from './modules/designations/designations.service';
import { seedDefaultCategories } from './modules/categories/categories.service';
import { seedDefaultServices } from './modules/services/services.service';

const server = http.createServer(app);
initSockets(server);
const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL as string);
    console.log('Connected to MongoDB');
    // Idempotent: only inserts what is missing, never overwrites admin changes.
    const added = await seedDefaultSettings();
    if (added) console.log(`Seeded ${added} default setting(s)`);
    await seedDefaultDesignations();
    await seedDefaultCategories(); // categories before services (services reference them)
    await seedDefaultServices();
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
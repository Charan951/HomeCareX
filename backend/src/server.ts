import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import { initSockets } from './sockets';
import { registerEarningsListeners } from './modules/earnings/earnings.listener';
import { seedDefaultSettings } from './modules/settings/settings.service';
import { seedDefaultDesignations } from './modules/designations/designations.service';
import { seedDefaultCategories } from './modules/categories/categories.service';
import { seedDefaultServices } from './modules/services/services.service';
import { upsertCatalogSeed } from './modules/catalog/catalog.seed';
import { ServiceModel } from './models/Service';

const server = http.createServer(app);
initSockets(server);
const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL as string);
    console.log('Connected to MongoDB');

    const added = await seedDefaultSettings();
    if (added) console.log(`Seeded ${added} default setting(s)`);
    await seedDefaultDesignations();

    const freshCatalog = (await ServiceModel.estimatedDocumentCount()) === 0;
    await seedDefaultCategories();
    await seedDefaultServices();
    if (freshCatalog) await upsertCatalogSeed();
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

// Graceful shutdown
const shutdown = async () => {
  console.log('Stopping server gracefully...');
  server.close(async () => {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
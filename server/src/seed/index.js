import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { seedUsers } from './users.seed.js';
import { seedDashboardData } from './dashboard.seed.js';

const run = async () => {
  await connectDB();

  const users = await seedUsers();
  const salesUsers = users.filter((u) => u.role !== 'hr'); // HR doesn't own a sales pipeline
  await seedDashboardData(salesUsers);

  await mongoose.connection.close();
  console.log('[seed] Done.');
  process.exit(0);
};

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});

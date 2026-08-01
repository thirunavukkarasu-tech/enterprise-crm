import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ROLES } from '../utils/roles.js';

/**
 * Idempotent seed script: run with `npm run seed`. Creates one demo account
 * per role so the login screen / RBAC can be exercised immediately without
 * a public registration endpoint (deliberately omitted — see
 * docs/ARCHITECTURE.md: enterprise CRMs provision users via an admin,
 * not public self-signup).
 */
const DEMO_USERS = [
  { name: 'Ava Admin', email: 'admin@crm.test', password: 'Password123', role: ROLES.ADMIN },
  { name: 'Harper HR', email: 'hr@crm.test', password: 'Password123', role: ROLES.HR },
  { name: 'Milo Manager', email: 'manager@crm.test', password: 'Password123', role: ROLES.MANAGER },
  { name: 'Eli Employee', email: 'employee@crm.test', password: 'Password123', role: ROLES.EMPLOYEE },
];

const run = async () => {
  await connectDB();

  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ email: demo.email });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`[seed] Skipped (already exists): ${demo.email}`);
      continue;
    }
    await User.create(demo);
    // eslint-disable-next-line no-console
    console.log(`[seed] Created: ${demo.email} / ${demo.password} (${demo.role})`);
  }

  await mongoose.connection.close();
  // eslint-disable-next-line no-console
  console.log('[seed] Done.');
  process.exit(0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Failed:', err);
  process.exit(1);
});

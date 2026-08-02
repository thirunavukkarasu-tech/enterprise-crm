import { User } from '../models/User.js';
import { ROLES } from '../utils/roles.js';

/**
 * Idempotent — safe to run repeatedly. Creates one demo account per role so
 * the login screen / RBAC can be exercised immediately without a public
 * registration endpoint (see docs/ARCHITECTURE.md).
 */
export const DEMO_USERS = [
  { name: 'Ava Admin', email: 'admin@crm.test', password: 'Password123', role: ROLES.ADMIN },
  { name: 'Harper HR', email: 'hr@crm.test', password: 'Password123', role: ROLES.HR },
  { name: 'Milo Manager', email: 'manager@crm.test', password: 'Password123', role: ROLES.MANAGER },
  { name: 'Priya Patel', email: 'priya@crm.test', password: 'Password123', role: ROLES.EMPLOYEE },
  { name: 'Diego Ramirez', email: 'diego@crm.test', password: 'Password123', role: ROLES.EMPLOYEE },
  { name: 'Chloe Nguyen', email: 'chloe@crm.test', password: 'Password123', role: ROLES.EMPLOYEE },
];

export const seedUsers = async () => {
  const created = [];
  for (const demo of DEMO_USERS) {
    let user = await User.findOne({ email: demo.email });
    if (!user) {
      user = await User.create(demo);
      // eslint-disable-next-line no-console
      console.log(`[seed:users] Created: ${demo.email} / ${demo.password} (${demo.role})`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[seed:users] Skipped (already exists): ${demo.email}`);
    }
    created.push(user);
  }
  return created;
};

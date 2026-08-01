/**
 * Single source of truth for role names. Imported by the User model
 * (schema enum), the authorize() middleware, and the seed script so the
 * literal strings never drift out of sync.
 */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
});

export const ALL_ROLES = Object.values(ROLES);

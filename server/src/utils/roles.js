/**
 * Single source of truth for role names. Imported by the User model
 * (schema enum), the authorize() middleware, and seed scripts so the
 * literal strings never drift out of sync.
 */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES_EXECUTIVE: 'sales_executive',
});

export const ALL_ROLES = Object.values(ROLES);

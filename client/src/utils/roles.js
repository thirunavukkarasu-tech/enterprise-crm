/**
 * Mirrors server/src/utils/roles.js. Kept as plain literals (not shared via
 * a monorepo package) to keep client/server independently deployable —
 * a deliberate trade-off for a two-package portfolio project.
 */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES_EXECUTIVE: 'sales_executive',
});

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.SALES_EXECUTIVE]: 'Sales Executive',
};

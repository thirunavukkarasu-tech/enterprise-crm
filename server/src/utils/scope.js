import { ROLES } from './roles.js';

/**
 * Returns a Mongoose filter fragment that scopes a query to the requesting
 * user's own records when they're an Employee, or leaves it unscoped
 * (org-wide visibility) for Admin/HR/Manager. Centralizing this in one
 * place means every dashboard query enforces the same visibility rule
 * instead of each aggregation re-deciding it independently.
 */
export const scopeToUser = (user, field = 'assignedTo') => {
  if (user.role === ROLES.EMPLOYEE) {
    return { [field]: user._id };
  }
  return {};
};

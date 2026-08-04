import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApiQuery } from './useApiQuery.js';
import { userService } from '../services/userService.js';
import { ROLES } from '../utils/roles.js';

/**
 * Only Admin/HR/Manager can reassign a customer/lead/task/follow-up (see
 * `assignedTo` handling in every service layer), and the `/users` endpoint
 * itself 403s for Employees — so this hook simply skips the request
 * entirely for an Employee instead of firing a call that's guaranteed to
 * fail and surface an unwanted error toast.
 */
export const useAssignableUsers = () => {
  const { user } = useAuth();
  const canAssign = user?.role !== ROLES.EMPLOYEE;

  const query = useApiQuery(() => (canAssign ? userService.listAssignable() : Promise.resolve([])), [canAssign]);

  return useMemo(() => ({ ...query, canAssign }), [query, canAssign]);
};

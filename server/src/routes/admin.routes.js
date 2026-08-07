import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import * as adminController from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../utils/roles.js';
import {
  listUsersValidator,
  userIdParamValidator,
  createUserValidator,
  updateUserValidator,
} from '../validators/user.validators.js';
import { auditLogQueryValidator, loginHistoryQueryValidator } from '../validators/admin.validators.js';

const router = Router();

// Every route in this file is Administration-only.
router.use(protect, authorize(ROLES.ADMIN));

// --- Manage Users --------------------------------------------------------------
router.get('/users', listUsersValidator, validate, userController.listUsers);
router.post('/users', createUserValidator, validate, userController.createUser);
router.get('/users/:id', userIdParamValidator, validate, userController.getUser);
router.patch('/users/:id', updateUserValidator, validate, userController.updateUser);

// --- Audit Logs & Login History -------------------------------------------------
router.get('/audit-logs', auditLogQueryValidator, validate, adminController.listAuditLogs);
router.get('/login-history', loginHistoryQueryValidator, validate, adminController.listLoginHistory);

export default router;

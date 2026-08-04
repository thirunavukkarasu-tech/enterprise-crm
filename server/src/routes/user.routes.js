import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';

const router = Router();

router.use(protect);

// Only roles that can reassign a customer/lead/task/follow-up need the
// full user list — an Employee never sees this endpoint since they can't
// reassign anything (see assertAccess/assignedTo handling in each service).
router.get('/', authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER), userController.listAssignableUsers);

export default router;

import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { monthsRangeValidator, limitValidator } from '../validators/dashboard.validators.js';
import { validate } from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';

const router = Router();

// Every dashboard route requires authentication. Individual widgets are
// scoped to the requesting user's own records when they're an Employee
// (see utils/scope.js) — this is enforced in the service layer, not here,
// so it can't be bypassed by hitting the endpoint directly.
router.use(protect);

router.get('/kpis', dashboardController.getKpis);
router.get('/pipeline', dashboardController.getPipeline);
router.get('/revenue-analytics', monthsRangeValidator, validate, dashboardController.getRevenueAnalytics);
router.get('/lead-conversion', dashboardController.getLeadConversion);
router.get('/activities', limitValidator, validate, dashboardController.getRecentActivities);
router.get('/tasks/upcoming', limitValidator, validate, dashboardController.getUpcomingTasks);
router.get('/notifications', limitValidator, validate, dashboardController.getNotifications);
router.get('/customer-growth', monthsRangeValidator, validate, dashboardController.getCustomerGrowth);

// Org-wide leaderboard — restricted to Admin/HR/Manager so an Employee
// can't see other reps' individual revenue numbers.
router.get(
  '/top-performers',
  authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER),
  limitValidator,
  validate,
  dashboardController.getTopPerformers
);

export default router;

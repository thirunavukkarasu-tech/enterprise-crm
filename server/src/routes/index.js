import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import customerRoutes from './customer.routes.js';
import leadRoutes from './lead.routes.js';
import taskRoutes from './task.routes.js';
import followUpRoutes from './followup.routes.js';
import userRoutes from './user.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customers', customerRoutes);
router.use('/leads', leadRoutes);
router.use('/tasks', taskRoutes);
router.use('/followups', followUpRoutes);
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);

// Phase 8+: mounted here as each module ships
// router.use('/settings', settingsRoutes);

export default router;

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
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';
import settingsRoutes from './settings.routes.js';

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
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/settings', settingsRoutes);

export default router;

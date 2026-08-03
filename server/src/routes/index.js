import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import customerRoutes from './customer.routes.js';
import leadRoutes from './lead.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customers', customerRoutes);
router.use('/leads', leadRoutes);

// Phase 6+: mounted here as each module ships
// router.use('/tasks', taskRoutes);
// router.use('/followups', followupRoutes);
// router.use('/reports', reportRoutes);
// router.use('/users', userRoutes);

export default router;

import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

// Phase 4+: mounted here as each module ships
// router.use('/customers', customerRoutes);
// router.use('/leads', leadRoutes);
// router.use('/tasks', taskRoutes);
// router.use('/followups', followupRoutes);
// router.use('/reports', reportRoutes);
// router.use('/users', userRoutes);

export default router;

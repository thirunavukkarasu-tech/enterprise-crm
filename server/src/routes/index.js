import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Phase 3+: mounted here as each module ships
// router.use('/customers', customerRoutes);
// router.use('/leads', leadRoutes);
// router.use('/tasks', taskRoutes);
// router.use('/followups', followupRoutes);
// router.use('/reports', reportRoutes);
// router.use('/users', userRoutes);

export default router;

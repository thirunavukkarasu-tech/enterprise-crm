import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);

// Phase 2+: mounted here as each module ships
// router.use('/auth', authRoutes);
// router.use('/customers', customerRoutes);
// router.use('/leads', leadRoutes);
// router.use('/tasks', taskRoutes);
// router.use('/followups', followupRoutes);
// router.use('/reports', reportRoutes);
// router.use('/users', userRoutes);

export default router;

import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { reportQueryValidator, exportQueryValidator } from '../validators/report.validators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// Export declared before the report GETs purely for readability — there's
// no path-collision risk here (unlike /customers/export vs /customers/:id)
// since every report route has a distinct static segment.
router.get('/export', exportQueryValidator, validate, reportController.exportReportFile);

router.get('/sales', reportQueryValidator, validate, reportController.getSalesReport);
router.get('/customers', reportQueryValidator, validate, reportController.getCustomerReport);
router.get('/leads', reportQueryValidator, validate, reportController.getLeadReport);
router.get('/tasks', reportQueryValidator, validate, reportController.getTaskReport);

export default router;

import { Router } from 'express';
import * as companySettingsController from '../controllers/companySettings.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../utils/roles.js';
import { updateCompanySettingsValidator } from '../validators/admin.validators.js';

const router = Router();

router.use(protect);

// Viewable by anyone authenticated (e.g. to render the company name/logo
// in the UI); editable by Admin only.
router.get('/company', companySettingsController.getCompanySettings);
router.patch(
  '/company',
  authorize(ROLES.ADMIN),
  updateCompanySettingsValidator,
  validate,
  companySettingsController.updateCompanySettings
);

export default router;

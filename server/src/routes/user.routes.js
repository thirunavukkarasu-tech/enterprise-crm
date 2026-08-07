import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';
import { uploadAvatar } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { updateProfileValidator, updatePreferencesValidator, changePasswordValidator } from '../validators/user.validators.js';

const router = Router();

router.use(protect);

// --- Self-service profile ("me") --------------------------------------------
router.get('/me', userController.getMyProfile);
router.patch('/me', updateProfileValidator, validate, userController.updateMyProfile);
router.post('/me/avatar', uploadAvatar.single('file'), userController.uploadMyAvatar);
router.patch('/me/preferences', updatePreferencesValidator, validate, userController.updateMyPreferences);
router.patch('/me/password', changePasswordValidator, validate, userController.changeMyPassword);

// --- Assignable users — lightweight list for "assign to" pickers -------------
// (Full paginated/filterable user administration lives at /admin/users —
// see routes/admin.routes.js — this endpoint deliberately stays simple
// since dropdowns don't need pagination.)
router.get('/', authorize(ROLES.ADMIN, ROLES.HR, ROLES.MANAGER), userController.listAssignableUsers);

export default router;

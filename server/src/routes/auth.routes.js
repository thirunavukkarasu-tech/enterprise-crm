import { Router } from 'express';
import {
  login,
  logout,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import {
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/auth.validators.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, validate, resetPassword);

export default router;

import { Router } from 'express';
import * as followUpController from '../controllers/followup.controller.js';
import {
  listFollowUpsValidator,
  followUpIdValidator,
  createFollowUpValidator,
  updateFollowUpValidator,
  customerHistoryValidator,
} from '../validators/followup.validators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// Declared before /:id — otherwise Express would match "customer" as an :id.
router.get(
  '/customer/:customerId',
  customerHistoryValidator,
  validate,
  followUpController.getCustomerHistory
);

router.get('/', listFollowUpsValidator, validate, followUpController.listFollowUps);
router.post('/', createFollowUpValidator, validate, followUpController.createFollowUp);

router.get('/:id', followUpIdValidator, validate, followUpController.getFollowUp);
router.patch('/:id', updateFollowUpValidator, validate, followUpController.updateFollowUp);
router.delete('/:id', followUpIdValidator, validate, followUpController.deleteFollowUp);

export default router;

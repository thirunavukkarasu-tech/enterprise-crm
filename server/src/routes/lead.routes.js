import { Router } from 'express';
import * as leadController from '../controllers/lead.controller.js';
import {
  listLeadsValidator,
  leadIdValidator,
  createLeadValidator,
  updateLeadValidator,
  addNoteValidator,
  timelineValidator,
  attachmentIdValidator,
} from '../validators/lead.validators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { uploadAttachment } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.get('/', listLeadsValidator, validate, leadController.listLeads);
router.post('/', createLeadValidator, validate, leadController.createLead);

router.get('/:id', leadIdValidator, validate, leadController.getLead);
router.patch('/:id', updateLeadValidator, validate, leadController.updateLead);
router.delete('/:id', leadIdValidator, validate, leadController.deleteLead);

router.post('/:id/convert', leadIdValidator, validate, leadController.convertLead);

router.post('/:id/notes', addNoteValidator, validate, leadController.addNote);
router.get('/:id/timeline', timelineValidator, validate, leadController.getTimeline);

router.post(
  '/:id/attachments',
  leadIdValidator,
  validate,
  uploadAttachment.single('file'),
  leadController.addAttachment
);
router.delete(
  '/:id/attachments/:attachmentId',
  attachmentIdValidator,
  validate,
  leadController.removeAttachment
);

export default router;

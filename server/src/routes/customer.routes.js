import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';
import {
  listCustomersValidator,
  customerIdValidator,
  createCustomerValidator,
  updateCustomerValidator,
  addNoteValidator,
  timelineValidator,
} from '../validators/customer.validators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { uploadCsv } from '../middleware/upload.js';

const router = Router();

router.use(protect);

// NOTE: /export and /import must be declared before the /:id routes below —
// otherwise Express would match the literal string "export"/"import" as an
// :id path param and route them to getCustomer/deleteCustomer instead.
router.get('/export', customerController.exportCustomers);
router.post('/import', uploadCsv.single('file'), customerController.importCustomers);

router.get('/', listCustomersValidator, validate, customerController.listCustomers);
router.post('/', createCustomerValidator, validate, customerController.createCustomer);

router.get('/:id', customerIdValidator, validate, customerController.getCustomer);
router.patch('/:id', updateCustomerValidator, validate, customerController.updateCustomer);
router.delete('/:id', customerIdValidator, validate, customerController.deleteCustomer);

router.post('/:id/notes', addNoteValidator, validate, customerController.addNote);
router.get('/:id/timeline', timelineValidator, validate, customerController.getTimeline);

export default router;

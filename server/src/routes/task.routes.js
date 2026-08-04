import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import {
  listTasksValidator,
  taskIdValidator,
  createTaskValidator,
  updateTaskValidator,
  addCommentValidator,
  timelineValidator,
  attachmentIdValidator,
} from '../validators/task.validators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { uploadTaskAttachment } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.get('/', listTasksValidator, validate, taskController.listTasks);
router.post('/', createTaskValidator, validate, taskController.createTask);

router.get('/:id', taskIdValidator, validate, taskController.getTask);
router.patch('/:id', updateTaskValidator, validate, taskController.updateTask);
router.delete('/:id', taskIdValidator, validate, taskController.deleteTask);

router.post('/:id/comments', addCommentValidator, validate, taskController.addComment);
router.get('/:id/timeline', timelineValidator, validate, taskController.getTimeline);

router.post(
  '/:id/attachments',
  taskIdValidator,
  validate,
  uploadTaskAttachment.single('file'),
  taskController.addAttachment
);
router.delete(
  '/:id/attachments/:attachmentId',
  attachmentIdValidator,
  validate,
  taskController.removeAttachment
);

export default router;

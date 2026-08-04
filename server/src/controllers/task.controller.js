import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as taskService from '../services/task.service.js';

export const listTasks = asyncHandler(async (req, res) => {
  const { items, meta } = await taskService.listTasks(req.user, req.query);
  new ApiResponse(200, items, 'Tasks fetched', meta).send(res);
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.user, req.params.id);
  new ApiResponse(200, task, 'Task fetched').send(res);
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user, req.body);
  new ApiResponse(201, task, 'Task created').send(res);
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user, req.params.id, req.body);
  new ApiResponse(200, task, 'Task updated').send(res);
});

export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user, req.params.id);
  new ApiResponse(200, null, 'Task deleted').send(res);
});

export const addComment = asyncHandler(async (req, res) => {
  const comment = await taskService.addComment(req.user, req.params.id, req.body.text);
  new ApiResponse(201, comment, 'Comment added').send(res);
});

export const getTimeline = asyncHandler(async (req, res) => {
  const timeline = await taskService.getTaskTimeline(req.user, req.params.id, req.query.limit);
  new ApiResponse(200, timeline, 'Task timeline fetched').send(res);
});

export const addAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file was uploaded');
  }
  const attachment = await taskService.addAttachment(req.user, req.params.id, req.file);
  new ApiResponse(201, attachment, 'Attachment uploaded').send(res);
});

export const removeAttachment = asyncHandler(async (req, res) => {
  await taskService.removeAttachment(req.user, req.params.id, req.params.attachmentId);
  new ApiResponse(200, null, 'Attachment removed').send(res);
});

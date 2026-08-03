import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as leadService from '../services/lead.service.js';

export const listLeads = asyncHandler(async (req, res) => {
  const { items, meta } = await leadService.listLeads(req.user, req.query);
  new ApiResponse(200, items, 'Leads fetched', meta).send(res);
});

export const getLead = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.user, req.params.id);
  new ApiResponse(200, lead, 'Lead fetched').send(res);
});

export const createLead = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.user, req.body);
  new ApiResponse(201, lead, 'Lead created').send(res);
});

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(req.user, req.params.id, req.body);
  new ApiResponse(200, lead, 'Lead updated').send(res);
});

export const deleteLead = asyncHandler(async (req, res) => {
  await leadService.deleteLead(req.user, req.params.id);
  new ApiResponse(200, null, 'Lead deleted').send(res);
});

export const addNote = asyncHandler(async (req, res) => {
  const note = await leadService.addNote(req.user, req.params.id, req.body.text);
  new ApiResponse(201, note, 'Note added').send(res);
});

export const getTimeline = asyncHandler(async (req, res) => {
  const timeline = await leadService.getLeadTimeline(req.user, req.params.id, req.query.limit);
  new ApiResponse(200, timeline, 'Lead timeline fetched').send(res);
});

export const convertLead = asyncHandler(async (req, res) => {
  const { lead, customer } = await leadService.convertLead(req.user, req.params.id);
  new ApiResponse(200, { lead, customer }, 'Lead converted to customer').send(res);
});

export const addAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file was uploaded');
  }
  const attachment = await leadService.addAttachment(req.user, req.params.id, req.file);
  new ApiResponse(201, attachment, 'Attachment uploaded').send(res);
});

export const removeAttachment = asyncHandler(async (req, res) => {
  await leadService.removeAttachment(req.user, req.params.id, req.params.attachmentId);
  new ApiResponse(200, null, 'Attachment removed').send(res);
});

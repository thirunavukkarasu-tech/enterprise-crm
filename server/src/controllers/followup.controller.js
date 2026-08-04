import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as followUpService from '../services/followup.service.js';

export const listFollowUps = asyncHandler(async (req, res) => {
  const { items, meta } = await followUpService.listFollowUps(req.user, req.query);
  new ApiResponse(200, items, 'Follow-ups fetched', meta).send(res);
});

export const getFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.getFollowUpById(req.user, req.params.id);
  new ApiResponse(200, followUp, 'Follow-up fetched').send(res);
});

export const getCustomerHistory = asyncHandler(async (req, res) => {
  const history = await followUpService.getFollowUpsForCustomer(
    req.user,
    req.params.customerId,
    req.query.limit
  );
  new ApiResponse(200, history, 'Customer interaction history fetched').send(res);
});

export const createFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.createFollowUp(req.user, req.body);
  new ApiResponse(201, followUp, 'Follow-up scheduled').send(res);
});

export const updateFollowUp = asyncHandler(async (req, res) => {
  const followUp = await followUpService.updateFollowUp(req.user, req.params.id, req.body);
  new ApiResponse(200, followUp, 'Follow-up updated').send(res);
});

export const deleteFollowUp = asyncHandler(async (req, res) => {
  await followUpService.deleteFollowUp(req.user, req.params.id);
  new ApiResponse(200, null, 'Follow-up deleted').send(res);
});

import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as companySettingsService from '../services/companySettings.service.js';

export const getCompanySettings = asyncHandler(async (req, res) => {
  const settings = await companySettingsService.getCompanySettings();
  new ApiResponse(200, settings, 'Company settings fetched').send(res);
});

export const updateCompanySettings = asyncHandler(async (req, res) => {
  const settings = await companySettingsService.updateCompanySettings(req.user, req.body, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  new ApiResponse(200, settings, 'Company settings updated').send(res);
});

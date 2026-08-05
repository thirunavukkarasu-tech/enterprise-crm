import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { resolveDateRange } from '../utils/dateRange.js';
import * as reportService from '../services/report.service.js';
import { exportReport } from '../services/reportExport.service.js';

export const getSalesReport = asyncHandler(async (req, res) => {
  const { from, to } = resolveDateRange(req.query);
  const groupBy = req.query.groupBy || 'month';
  const data = await reportService.getSalesReport(req.user, { from, to, groupBy });
  new ApiResponse(200, data, 'Sales report fetched').send(res);
});

export const getCustomerReport = asyncHandler(async (req, res) => {
  const { from, to } = resolveDateRange(req.query);
  const groupBy = req.query.groupBy || 'month';
  const data = await reportService.getCustomerReport(req.user, { from, to, groupBy });
  new ApiResponse(200, data, 'Customer report fetched').send(res);
});

export const getLeadReport = asyncHandler(async (req, res) => {
  const { from, to } = resolveDateRange(req.query);
  const data = await reportService.getLeadReport(req.user, { from, to });
  new ApiResponse(200, data, 'Lead report fetched').send(res);
});

export const getTaskReport = asyncHandler(async (req, res) => {
  const { from, to } = resolveDateRange(req.query);
  const data = await reportService.getTaskReport(req.user, { from, to });
  new ApiResponse(200, data, 'Task report fetched').send(res);
});

export const exportReportFile = asyncHandler(async (req, res) => {
  const { from, to } = resolveDateRange(req.query);
  const { type, format } = req.query;

  const { buffer, filename, contentType } = await exportReport(req.user, { type, format, from, to });

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

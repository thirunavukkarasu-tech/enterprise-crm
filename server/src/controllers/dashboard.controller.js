import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as dashboardService from '../services/dashboard.service.js';

export const getKpis = asyncHandler(async (req, res) => {
  const data = await dashboardService.getKpis(req.user);
  new ApiResponse(200, data, 'KPIs fetched').send(res);
});

export const getPipeline = asyncHandler(async (req, res) => {
  const data = await dashboardService.getPipeline(req.user);
  new ApiResponse(200, data, 'Sales pipeline fetched').send(res);
});

export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const months = req.query.months || 6;
  const data = await dashboardService.getRevenueAnalytics(req.user, months);
  new ApiResponse(200, data, 'Revenue analytics fetched').send(res);
});

export const getLeadConversion = asyncHandler(async (req, res) => {
  const data = await dashboardService.getLeadConversion(req.user);
  new ApiResponse(200, data, 'Lead conversion funnel fetched').send(res);
});

export const getRecentActivities = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 10;
  const data = await dashboardService.getRecentActivities(req.user, limit);
  new ApiResponse(200, data, 'Recent activities fetched').send(res);
});

export const getUpcomingTasks = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 5;
  const data = await dashboardService.getUpcomingTasks(req.user, limit);
  new ApiResponse(200, data, 'Upcoming tasks fetched').send(res);
});

export const getNotifications = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 10;
  const data = await dashboardService.getNotifications(req.user, limit);
  new ApiResponse(200, data, 'Notifications fetched').send(res);
});

export const getTopPerformers = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 5;
  const data = await dashboardService.getTopPerformers(limit);
  new ApiResponse(200, data, 'Top performers fetched').send(res);
});

export const getCustomerGrowth = asyncHandler(async (req, res) => {
  const months = req.query.months || 6;
  const data = await dashboardService.getCustomerGrowth(req.user, months);
  new ApiResponse(200, data, 'Customer growth statistics fetched').send(res);
});

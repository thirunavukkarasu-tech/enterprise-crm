import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as auditService from '../services/audit.service.js';

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, action, actor, from, to } = req.query;
  const { items, meta } = await auditService.listAuditLogs({
    page: Number(page),
    limit: Number(limit),
    action,
    actor,
    from,
    to,
  });
  new ApiResponse(200, items, 'Audit logs fetched', meta).send(res);
});

export const listLoginHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, actor, from, to } = req.query;
  const { items, meta } = await auditService.listLoginHistory({
    page: Number(page),
    limit: Number(limit),
    actor,
    from,
    to,
  });
  new ApiResponse(200, items, 'Login history fetched', meta).send(res);
});

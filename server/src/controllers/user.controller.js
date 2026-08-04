import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as userService from '../services/user.service.js';

export const listAssignableUsers = asyncHandler(async (req, res) => {
  const users = await userService.listAssignableUsers();
  new ApiResponse(200, users, 'Users fetched').send(res);
});

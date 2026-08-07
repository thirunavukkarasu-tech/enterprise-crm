import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as userService from '../services/user.service.js';

const reqMeta = (req) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

// --- Assignable users (existing) --------------------------------------------

export const listAssignableUsers = asyncHandler(async (req, res) => {
  const users = await userService.listAssignableUsers();
  new ApiResponse(200, users, 'Users fetched').send(res);
});

// --- Self-service profile ("/users/me/*") -----------------------------------

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user);
  new ApiResponse(200, profile, 'Profile fetched').send(res);
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await userService.updateProfile(req.user, req.body);
  new ApiResponse(200, profile, 'Profile updated').send(res);
});

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const url = `/uploads/avatars/${req.file.filename}`;
  const profile = await userService.updateAvatar(req.user, url);
  new ApiResponse(200, profile, 'Avatar updated').send(res);
});

export const updateMyPreferences = asyncHandler(async (req, res) => {
  const profile = await userService.updatePreferences(req.user, req.body);
  new ApiResponse(200, profile, 'Preferences updated').send(res);
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user, req.body, reqMeta(req));
  new ApiResponse(200, null, 'Password changed successfully').send(res);
});

// --- Administration > Manage Users ------------------------------------------

export const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q, role, isActive } = req.query;
  const { items, meta } = await userService.listUsers({ page: Number(page), limit: Number(limit), q, role, isActive });
  new ApiResponse(200, items, 'Users fetched', meta).send(res);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  new ApiResponse(200, user, 'User fetched').send(res);
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.user, req.body, reqMeta(req));
  new ApiResponse(201, user, 'User created').send(res);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.user, req.params.id, req.body, reqMeta(req));
  new ApiResponse(200, user, 'User updated').send(res);
});

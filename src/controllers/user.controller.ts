import { Request, Response, RequestHandler } from 'express';
import httpStatus from 'http-status';
import * as userService from '../services/user.service';
import catchAsync from '../utils/catchAsync';
import createApiError from '../utils/ApiError';

/**
 * Get current authenticated user (from token)
 */
export const getMe: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createApiError(httpStatus.UNAUTHORIZED, 'Not authenticated');
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: req.user,
  });
});

/**
 * Update current authenticated user profile
 */
export const updateMe: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createApiError(httpStatus.UNAUTHORIZED, 'Not authenticated');
  }

  // Users can only update certain fields for themselves
  const allowedFields = ['firstName', 'lastName', 'displayName', 'avatarUrl'];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await userService.updateUser(req.user.id, updates);
  res.status(httpStatus.OK).json({
    success: true,
    data: user,
  });
});

/**
 * Get all users (admin only)
 */
export const getAllUsers: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  const { users, total } = await userService.getAllUsers(page, pageSize);

  res.status(httpStatus.OK).json({
    success: true,
    data: users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

/**
 * Get user by ID
 */
export const getUserById: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  res.status(httpStatus.OK).json({
    success: true,
    data: user,
  });
});

/**
 * Get user by subject (Asgardeo ID)
 */
export const getUserBySubject: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserBySubject(req.params.subject);
  res.status(httpStatus.OK).json({
    success: true,
    data: user,
  });
});

/**
 * Get users by organization
 */
export const getUsersByOrganization: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

  const { users, total } = await userService.getUsersByOrganization(
    req.params.organizationId,
    page,
    pageSize,
  );

  res.status(httpStatus.OK).json({
    success: true,
    data: users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

/**
 * Update user (admin only)
 */
export const updateUser: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(httpStatus.OK).json({
    success: true,
    data: user,
  });
});

/**
 * Delete user (admin only)
 */
export const deleteUser: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  await userService.deleteUser(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get user statistics (admin only)
 */
export const getUserStatistics: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const stats = await userService.getUserStatistics();
  res.status(httpStatus.OK).json({
    success: true,
    data: stats,
  });
});

/**
 * Get users list (for dropdowns, accessible to all authenticated users)
 * Returns only basic info: id, email, displayName, avatarUrl
 */
export const getUsersList: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const { users } = await userService.getAllUsers(1, 1000); // Get up to 1000 users

  // Return only safe fields for dropdowns
  const usersList = users.map(user => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  }));

  res.status(httpStatus.OK).json({
    success: true,
    data: usersList,
  });
});


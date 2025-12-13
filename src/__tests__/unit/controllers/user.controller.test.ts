import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as userController from '../../../controllers/user.controller';
import * as userService from '../../../services/user.service';
import { User, UserRole, UserStatus } from '../../../models/user.model';

// Mock the service layer
jest.mock('../../../services/user.service');

const mockedUserService = userService as jest.Mocked<typeof userService>;

describe('User Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-uuid-1234',
    subject: 'asgardeo-sub-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      body: {},
      query: {},
      user: createMockUser(),
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('getMe', () => {
    it('should return current user with 200 status', async () => {
      const user = createMockUser();
      mockReq.user = user;

      await userController.getMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: user,
      });
    });

    it('should throw error when user is not authenticated', async () => {
      mockReq.user = undefined;

      await userController.getMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
      }));
    });
  });

  describe('updateMe', () => {
    it('should update current user profile with allowed fields', async () => {
      const user = createMockUser();
      mockReq.user = user;
      mockReq.body = {
        firstName: 'Updated',
        lastName: 'Name',
        displayName: 'Updated Name',
        avatarUrl: 'https://new-avatar.com',
        role: 'admin', // Should be ignored (not allowed)
      };

      const updatedUser = { ...user, firstName: 'Updated', lastName: 'Name' };
      mockedUserService.updateUser.mockResolvedValue(updatedUser);

      await userController.updateMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.updateUser).toHaveBeenCalledWith(user.id, {
        firstName: 'Updated',
        lastName: 'Name',
        displayName: 'Updated Name',
        avatarUrl: 'https://new-avatar.com',
      });
      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.OK);
    });

    it('should throw error when not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = { firstName: 'Test' };

      await userController.updateMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
      }));
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      const users = [createMockUser(), createMockUser({ id: 'user-2' })];
      mockReq.query = { page: '1', pageSize: '10' };
      mockedUserService.getAllUsers.mockResolvedValue({ users, total: 2 });

      await userController.getAllUsers(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.getAllUsers).toHaveBeenCalledWith(1, 10);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: users,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should use default pagination values', async () => {
      mockReq.query = {};
      mockedUserService.getAllUsers.mockResolvedValue({ users: [], total: 0 });

      await userController.getAllUsers(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.getAllUsers).toHaveBeenCalledWith(1, 20);
    });

    it('should limit pageSize to max 100', async () => {
      mockReq.query = { page: '1', pageSize: '500' };
      mockedUserService.getAllUsers.mockResolvedValue({ users: [], total: 0 });

      await userController.getAllUsers(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.getAllUsers).toHaveBeenCalledWith(1, 100);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const user = createMockUser();
      mockReq.params = { id: 'user-uuid-1234' };
      mockedUserService.getUserById.mockResolvedValue(user);

      await userController.getUserById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.getUserById).toHaveBeenCalledWith('user-uuid-1234');
      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: user,
      });
    });
  });

  describe('getUserBySubject', () => {
    it('should return user by subject', async () => {
      const user = createMockUser();
      mockReq.params = { subject: 'asgardeo-sub-123' };
      mockedUserService.getUserBySubject.mockResolvedValue(user);

      await userController.getUserBySubject(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.getUserBySubject).toHaveBeenCalledWith('asgardeo-sub-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: user,
      });
    });
  });

  describe('getUsersByOrganization', () => {
    it('should return paginated users by organization', async () => {
      const users = [createMockUser()];
      mockReq.params = { organizationId: 'org-123' };
      mockReq.query = { page: '2', pageSize: '15' };
      mockedUserService.getUsersByOrganization.mockResolvedValue({ users, total: 20 });

      await userController.getUsersByOrganization(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.getUsersByOrganization).toHaveBeenCalledWith('org-123', 2, 15);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: users,
        pagination: {
          page: 2,
          pageSize: 15,
          total: 20,
          totalPages: 2,
        },
      });
    });
  });

  describe('updateUser', () => {
    it('should update user by id', async () => {
      const updateData = { firstName: 'Updated', role: UserRole.ADMIN };
      mockReq.params = { id: 'user-uuid-1234' };
      mockReq.body = updateData;
      const updatedUser = createMockUser({ ...updateData });
      mockedUserService.updateUser.mockResolvedValue(updatedUser);

      await userController.updateUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.updateUser).toHaveBeenCalledWith('user-uuid-1234', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.OK);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return 204', async () => {
      mockReq.params = { id: 'user-uuid-1234' };
      mockedUserService.deleteUser.mockResolvedValue();

      await userController.deleteUser(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.deleteUser).toHaveBeenCalledWith('user-uuid-1234');
      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.NO_CONTENT);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('getUserStatistics', () => {
    it('should return user statistics', async () => {
      const stats = {
        total: 100,
        byStatus: { active: 80, inactive: 15, suspended: 5 },
      };
      mockedUserService.getUserStatistics.mockResolvedValue(stats);

      await userController.getUserStatistics(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.getUserStatistics).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: stats,
      });
    });
  });
});


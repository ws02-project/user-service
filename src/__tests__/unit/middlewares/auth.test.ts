import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { authenticate, optionalAuth, authorize, requireScope } from '../../../middlewares/auth';
import { asgardeoService } from '../../../services/asgardeo.service';
import { User, UserRole, UserStatus } from '../../../models/user.model';

// Mock dependencies
jest.mock('../../../services/asgardeo.service');
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const mockedAsgardeoService = asgardeoService as jest.Mocked<typeof asgardeoService>;

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  const createMockUser = (): User => ({
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
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
      requestId: 'req-123',
      path: '/api/test',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and set user', async () => {
      const mockPayload = {
        sub: 'asgardeo-sub-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
        roles: ['user'],
        scope: 'openid profile',
      };
      const mockUser = createMockUser();

      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockedAsgardeoService.validateToken.mockResolvedValue(mockPayload);
      mockedAsgardeoService.syncUser.mockResolvedValue(mockUser);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedAsgardeoService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(mockedAsgardeoService.syncUser).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'asgardeo-sub-123',
        email: 'test@example.com',
      }));
      expect(mockReq.user).toEqual(mockUser);
      expect(mockReq.tokenPayload).toBeDefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject when no authorization header', async () => {
      mockReq.headers = {};

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'No access token provided',
      }));
    });

    it('should reject when authorization header is not Bearer', async () => {
      mockReq.headers = { authorization: 'Basic invalid-token' };

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'No access token provided',
      }));
    });

    it('should reject when token is invalid (no sub)', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      mockedAsgardeoService.validateToken.mockResolvedValue({});

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      }));
    });

    it('should handle token expiration error', async () => {
      mockReq.headers = { authorization: 'Bearer expired-token' };
      mockedAsgardeoService.validateToken.mockRejectedValue(new Error('token has expired'));

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Token has expired',
      }));
    });

    it('should handle invalid token error', async () => {
      mockReq.headers = { authorization: 'Bearer bad-token' };
      mockedAsgardeoService.validateToken.mockRejectedValue(new Error('invalid token signature'));

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid token',
      }));
    });

    it('should extract roles from groups claim', async () => {
      const mockPayload = {
        sub: 'asgardeo-sub-123',
        email: 'test@example.com',
        groups: ['admin', 'manager'],
      };
      const mockUser = createMockUser();

      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockedAsgardeoService.validateToken.mockResolvedValue(mockPayload);
      mockedAsgardeoService.syncUser.mockResolvedValue(mockUser);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedAsgardeoService.syncUser).toHaveBeenCalledWith(expect.objectContaining({
        roles: ['admin', 'manager'],
      }));
    });

    it('should use username as email if email not present', async () => {
      const mockPayload = {
        sub: 'asgardeo-sub-123',
        username: 'user@example.com',
      };
      const mockUser = createMockUser();

      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockedAsgardeoService.validateToken.mockResolvedValue(mockPayload);
      mockedAsgardeoService.syncUser.mockResolvedValue(mockUser);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedAsgardeoService.syncUser).toHaveBeenCalledWith(expect.objectContaining({
        email: 'user@example.com',
      }));
    });
  });

  describe('optionalAuth', () => {
    it('should pass without token', async () => {
      mockReq.headers = {};

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should set user when valid token provided', async () => {
      const mockPayload = {
        sub: 'asgardeo-sub-123',
        email: 'test@example.com',
      };
      const mockUser = createMockUser();

      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockedAsgardeoService.validateToken.mockResolvedValue(mockPayload);
      mockedAsgardeoService.syncUser.mockResolvedValue(mockUser);

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without error when token validation fails', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      mockedAsgardeoService.validateToken.mockRejectedValue(new Error('Invalid token'));

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('authorize', () => {
    it('should allow access when user has required role', () => {
      const mockUser = createMockUser();
      mockUser.role = UserRole.ADMIN;
      mockReq.user = mockUser;

      const middleware = authorize(UserRole.ADMIN, UserRole.MANAGER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user does not have required role', () => {
      const mockUser = createMockUser();
      mockUser.role = UserRole.USER;
      mockReq.user = mockUser;

      const middleware = authorize(UserRole.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: httpStatus.FORBIDDEN,
        message: 'Insufficient permissions',
      }));
    });

    it('should deny access when user is not authenticated', () => {
      mockReq.user = undefined;

      const middleware = authorize(UserRole.USER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Not authenticated',
      }));
    });
  });

  describe('requireScope', () => {
    it('should allow access when user has all required scopes', () => {
      mockReq.tokenPayload = {
        sub: 'test-sub',
        scopes: ['openid', 'profile', 'email'],
      };

      const middleware = requireScope('openid', 'profile');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user is missing required scopes', () => {
      mockReq.tokenPayload = {
        sub: 'test-sub',
        scopes: ['openid'],
      };

      const middleware = requireScope('openid', 'admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: httpStatus.FORBIDDEN,
      }));
    });

    it('should deny access when no scopes in token', () => {
      mockReq.tokenPayload = {
        sub: 'test-sub',
      };

      const middleware = requireScope('openid');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No scopes in token',
      }));
    });
  });
});


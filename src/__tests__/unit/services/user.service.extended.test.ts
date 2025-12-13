import { Repository } from 'typeorm';
import * as grpc from '@grpc/grpc-js';
import { User, UserRole, UserStatus } from '../../../models/user.model';
import * as userService from '../../../services/user.service';
import { AppDataSource } from '../../../config/database';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../../messaging', () => ({
  publishUserCreated: jest.fn().mockResolvedValue(undefined),
  publishUserUpdated: jest.fn().mockResolvedValue(undefined),
  publishUserRoleChanged: jest.fn().mockResolvedValue(undefined),
  publishUserStatusChanged: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('User Service - Extended Tests', () => {
  let mockRepository: jest.Mocked<Repository<User>>;

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

    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      const users = [createMockUser()];
      mockRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await userService.getAllUsers(1, 20);

      expect(result).toEqual({ users, total: 1 });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should use default pagination values', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await userService.getAllUsers();

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const user = createMockUser();
      mockRepository.findOne.mockResolvedValue(user);

      const result = await userService.getUserById('user-uuid-1234');

      expect(result).toEqual(user);
    });

    it('should throw 404 when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.getUserById('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('getUserBySubject', () => {
    it('should return user when found', async () => {
      const user = createMockUser();
      mockRepository.findOne.mockResolvedValue(user);

      const result = await userService.getUserBySubject('asgardeo-sub-123');

      expect(result).toEqual(user);
    });

    it('should throw 404 when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.getUserBySubject('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const user = createMockUser();
      mockRepository.findOne.mockResolvedValue(user);

      const result = await userService.getUserByEmail('test@example.com');

      expect(result).toEqual(user);
    });

    it('should throw 404 when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.getUserByEmail('nonexistent@example.com')).rejects.toThrow();
    });
  });

  describe('getUsersByIds', () => {
    it('should return users by IDs', async () => {
      const users = [createMockUser(), createMockUser({ id: 'user-2' })];
      mockRepository.find.mockResolvedValue(users);

      const result = await userService.getUsersByIds(['user-uuid-1234', 'user-2']);

      expect(result).toEqual(users);
    });

    it('should return empty array for empty input', async () => {
      const result = await userService.getUsersByIds([]);

      expect(result).toEqual([]);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create new user', async () => {
      const userData = {
        subject: 'new-sub',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      };
      const savedUser = createMockUser(userData);

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(savedUser);
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(savedUser);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw when subject already exists', async () => {
      mockRepository.findOne.mockResolvedValueOnce(createMockUser());

      await expect(userService.createUser({
        subject: 'existing-sub',
        email: 'new@example.com',
      })).rejects.toThrow('User with this subject already exists');
    });

    it('should throw when email already exists', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null) // subject check
        .mockResolvedValueOnce(createMockUser()); // email check

      await expect(userService.createUser({
        subject: 'new-sub',
        email: 'existing@example.com',
      })).rejects.toThrow('User with this email already exists');
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const user = createMockUser();
      const updateData = { firstName: 'Updated' };
      const updatedUser = { ...user, ...updateData };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('user-uuid-1234', updateData);

      expect(result.firstName).toBe('Updated');
    });

    it('should publish role change event when role changes', async () => {
      const messaging = require('../../../messaging');
      const user = createMockUser({ role: UserRole.USER });
      const updateData = { role: UserRole.ADMIN };
      const updatedUser = { ...user, ...updateData };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue(updatedUser);

      await userService.updateUser('user-uuid-1234', updateData);

      expect(messaging.publishUserRoleChanged).toHaveBeenCalled();
    });

    it('should publish status change event when status changes', async () => {
      const messaging = require('../../../messaging');
      const user = createMockUser({ status: UserStatus.ACTIVE });
      const updateData = { status: UserStatus.SUSPENDED };
      const updatedUser = { ...user, ...updateData };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue(updatedUser);

      await userService.updateUser('user-uuid-1234', updateData);

      expect(messaging.publishUserStatusChanged).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const user = createMockUser();
      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.remove.mockResolvedValue(user);

      await userService.deleteUser('user-uuid-1234');

      expect(mockRepository.remove).toHaveBeenCalledWith(user);
    });
  });

  describe('getUserStatistics', () => {
    it('should return user statistics', async () => {
      mockRepository.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // active
        .mockResolvedValueOnce(15) // inactive
        .mockResolvedValueOnce(5); // suspended

      const result = await userService.getUserStatistics();

      expect(result).toEqual({
        total: 100,
        byStatus: { active: 80, inactive: 15, suspended: 5 },
      });
    });
  });

  describe('gRPC handlers', () => {
    describe('getUserGrpc', () => {
      it('should return user when found', async () => {
        const user = createMockUser();
        mockRepository.findOne.mockResolvedValue(user);
        const callback = jest.fn();

        await userService.getUserGrpc({ request: { user_id: 'user-uuid-1234' } }, callback);

        expect(callback).toHaveBeenCalledWith(null, expect.objectContaining({
          user: expect.any(Object),
        }));
      });

      it('should return error when user_id is missing', async () => {
        const callback = jest.fn();

        await userService.getUserGrpc({ request: { user_id: '' } }, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ code: grpc.status.INVALID_ARGUMENT }),
        );
      });
    });

    describe('getUserBySubjectGrpc', () => {
      it('should return user when found', async () => {
        const user = createMockUser();
        mockRepository.findOne.mockResolvedValue(user);
        const callback = jest.fn();

        await userService.getUserBySubjectGrpc({ request: { subject: 'asgardeo-sub-123' } }, callback);

        expect(callback).toHaveBeenCalledWith(null, expect.objectContaining({
          user: expect.any(Object),
        }));
      });

      it('should return error when subject is missing', async () => {
        const callback = jest.fn();

        await userService.getUserBySubjectGrpc({ request: { subject: '' } }, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ code: grpc.status.INVALID_ARGUMENT }),
        );
      });
    });

    describe('getUsersGrpc', () => {
      it('should return users by IDs', async () => {
        const users = [createMockUser()];
        mockRepository.find.mockResolvedValue(users);
        const callback = jest.fn();

        await userService.getUsersGrpc({ request: { user_ids: ['user-1', 'user-2'] } }, callback);

        expect(callback).toHaveBeenCalledWith(null, expect.objectContaining({
          users: expect.any(Array),
          total: 1,
        }));
      });
    });

    describe('syncUserGrpc', () => {
      it('should create new user if not exists', async () => {
        mockRepository.findOne.mockResolvedValue(null);
        const newUser = createMockUser();
        mockRepository.create.mockReturnValue(newUser);
        mockRepository.save.mockResolvedValue(newUser);
        const callback = jest.fn();

        await userService.syncUserGrpc({
          request: {
            subject: 'new-sub',
            email: 'new@example.com',
            first_name: 'New',
            last_name: 'User',
          },
        }, callback);

        expect(callback).toHaveBeenCalledWith(null, expect.objectContaining({
          is_new_user: true,
        }));
      });

      it('should update existing user', async () => {
        const existingUser = createMockUser();
        mockRepository.findOne.mockResolvedValue(existingUser);
        mockRepository.save.mockResolvedValue(existingUser);
        const callback = jest.fn();

        await userService.syncUserGrpc({
          request: {
            subject: 'asgardeo-sub-123',
            email: 'test@example.com',
            first_name: 'Updated',
          },
        }, callback);

        expect(callback).toHaveBeenCalledWith(null, expect.objectContaining({
          is_new_user: false,
        }));
      });

      it('should return error when subject/email missing', async () => {
        const callback = jest.fn();

        await userService.syncUserGrpc({
          request: { subject: '', email: '' },
        }, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ code: grpc.status.INVALID_ARGUMENT }),
        );
      });
    });

    describe('getUsersByOrganizationGrpc', () => {
      it('should return users by organization', async () => {
        const users = [createMockUser()];
        mockRepository.findAndCount.mockResolvedValue([users, 1]);
        const callback = jest.fn();

        await userService.getUsersByOrganizationGrpc({
          request: { organization_id: 'org-123', page: 1, page_size: 20 },
        }, callback);

        expect(callback).toHaveBeenCalledWith(null, expect.objectContaining({
          users: expect.any(Array),
          total: 1,
        }));
      });

      it('should return error when organization_id is missing', async () => {
        const callback = jest.fn();

        await userService.getUsersByOrganizationGrpc({
          request: { organization_id: '' },
        }, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ code: grpc.status.INVALID_ARGUMENT }),
        );
      });
    });
  });
});


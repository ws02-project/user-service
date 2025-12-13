import { Repository } from 'typeorm';
import { User, UserStatus, UserRole } from '../../models/user.model';
import * as userService from '../../services/user.service';
import { AppDataSource } from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../messaging', () => ({
  publishUserCreated: jest.fn().mockResolvedValue(undefined),
  publishUserUpdated: jest.fn().mockResolvedValue(undefined),
  publishUserRoleChanged: jest.fn().mockResolvedValue(undefined),
  publishUserStatusChanged: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('User Service', () => {
  let mockRepository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 'user-uuid-1234',
    subject: 'auth0|123456',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    avatarUrl: undefined,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    organizationId: 'org-123',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
      const users = [mockUser];
      mockRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await userService.getAllUsers(1, 20);

      expect(result.users).toEqual(users);
      expect(result.total).toBe(1);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should handle pagination correctly', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await userService.getAllUsers(2, 10);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.getUserById('user-uuid-1234');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1234' },
      });
    });

    it('should throw error when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.getUserById('non-existent')).rejects.toThrow();
    });
  });

  describe('getUserBySubject', () => {
    it('should return user by subject', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.getUserBySubject('auth0|123456');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { subject: 'auth0|123456' },
      });
    });

    it('should throw error when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.getUserBySubject('non-existent')).rejects.toThrow();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should throw error when email not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.getUserByEmail('notfound@example.com')).rejects.toThrow();
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const createData = {
        subject: 'auth0|new-user',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await userService.createUser(createData);

      expect(result).toEqual(mockUser);
    });

    it('should throw error when subject already exists', async () => {
      mockRepository.findOne.mockResolvedValueOnce(mockUser);

      await expect(
        userService.createUser({
          subject: 'auth0|123456',
          email: 'another@example.com',
        }),
      ).rejects.toThrow('User with this subject already exists');
    });

    it('should throw error when email already exists', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null) // subject check
        .mockResolvedValueOnce(mockUser); // email check

      await expect(
        userService.createUser({
          subject: 'auth0|new-user',
          email: 'test@example.com',
        }),
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, firstName: 'Jane' };

      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('user-uuid-1234', updateData);

      expect(result.firstName).toBe('Jane');
    });

    it('should throw error when updating non-existent user', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        userService.updateUser('non-existent', { firstName: 'Test' }),
      ).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.remove.mockResolvedValue(mockUser);

      await expect(userService.deleteUser('user-uuid-1234')).resolves.not.toThrow();
      expect(mockRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error when deleting non-existent user', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(userService.deleteUser('non-existent')).rejects.toThrow();
    });
  });

  describe('getUserStatistics', () => {
    it('should return correct statistics', async () => {
      mockRepository.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // active
        .mockResolvedValueOnce(15) // inactive
        .mockResolvedValueOnce(5); // suspended

      const result = await userService.getUserStatistics();

      expect(result).toEqual({
        total: 100,
        byStatus: {
          active: 80,
          inactive: 15,
          suspended: 5,
        },
      });
    });
  });

  describe('getUsersByOrganization', () => {
    it('should return users for an organization', async () => {
      const users = [mockUser];
      mockRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await userService.getUsersByOrganization('org-123', 1, 20);

      expect(result.users).toEqual(users);
      expect(result.total).toBe(1);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });
});


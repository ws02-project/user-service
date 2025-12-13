import { Repository, In } from 'typeorm';
import { User, CreateUserDTO, UpdateUserDTO, UserStatus, UserRole } from '../models/user.model';
import createApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { AppDataSource } from '../config/database';
import * as grpc from '@grpc/grpc-js';
import logger from '../utils/logger';
import { publishUserCreated, publishUserUpdated, publishUserRoleChanged, publishUserStatusChanged } from '../messaging';

const getUserRepository = (): Repository<User> => AppDataSource.getRepository(User);

export const getAllUsers = async (page: number = 1, pageSize: number = 20): Promise<{ users: User[]; total: number }> => {
  const userRepository = getUserRepository();
  const [users, total] = await userRepository.findAndCount({
    order: { createdAt: 'DESC' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return { users, total };
};

export const getUserById = async (id: string): Promise<User> => {
  const userRepository = getUserRepository();
  const user = await userRepository.findOne({ where: { id } });

  if (!user) {
    throw createApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

export const getUserBySubject = async (subject: string): Promise<User> => {
  const userRepository = getUserRepository();
  const user = await userRepository.findOne({ where: { subject } });

  if (!user) {
    throw createApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

export const getUserByEmail = async (email: string): Promise<User> => {
  const userRepository = getUserRepository();
  const user = await userRepository.findOne({ where: { email } });

  if (!user) {
    throw createApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

export const getUsersByIds = async (ids: string[]): Promise<User[]> => {
  if (ids.length === 0) return [];
  
  const userRepository = getUserRepository();
  return await userRepository.find({
    where: { id: In(ids) },
  });
};

export const getUsersByOrganization = async (
  organizationId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<{ users: User[]; total: number }> => {
  const userRepository = getUserRepository();
  const [users, total] = await userRepository.findAndCount({
    where: { organizationId },
    order: { createdAt: 'DESC' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return { users, total };
};

export const createUser = async (userData: CreateUserDTO): Promise<User> => {
  const startTime = Date.now();
  const userRepository = getUserRepository();

  // Check if user with same subject or email exists
  const existingBySubject = await userRepository.findOne({ where: { subject: userData.subject } });
  if (existingBySubject) {
    logger.warn('User creation failed - Subject exists', {
      type: 'user_create_failed',
      reason: 'subject_exists',
      subject: userData.subject,
    });
    throw createApiError(httpStatus.CONFLICT, 'User with this subject already exists');
  }

  const existingByEmail = await userRepository.findOne({ where: { email: userData.email } });
  if (existingByEmail) {
    logger.warn('User creation failed - Email exists', {
      type: 'user_create_failed',
      reason: 'email_exists',
      email: userData.email,
    });
    throw createApiError(httpStatus.CONFLICT, 'User with this email already exists');
  }

  const user = userRepository.create({
    subject: userData.subject,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    displayName: userData.displayName,
    avatarUrl: userData.avatarUrl,
    role: userData.role || UserRole.USER,
    status: UserStatus.ACTIVE,
    organizationId: userData.organizationId,
    metadata: userData.metadata,
  });

  const savedUser = await userRepository.save(user);

  logger.info('User created', {
    type: 'user_created',
    userId: savedUser.id,
    email: savedUser.email,
    role: savedUser.role,
    organizationId: savedUser.organizationId,
    duration: Date.now() - startTime,
  });

  // Publish user created event
  try {
    await publishUserCreated(
      savedUser.id,
      savedUser.subject,
      savedUser.email,
      savedUser.firstName,
      savedUser.lastName,
      savedUser.displayName,
      savedUser.organizationId,
    );
    logger.info('Event published - user.created', {
      type: 'event_published',
      eventType: 'user.created',
      userId: savedUser.id,
    });
  } catch (error) {
    logger.error('Failed to publish user.created event', {
      type: 'event_publish_failed',
      eventType: 'user.created',
      userId: savedUser.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return savedUser;
};

export const updateUser = async (id: string, updateData: UpdateUserDTO): Promise<User> => {
  const startTime = Date.now();
  const userRepository = getUserRepository();
  const user = await getUserById(id);

  const oldRole = user.role;
  const oldStatus = user.status;
  const changedFields: string[] = [];

  // Track changed fields
  Object.keys(updateData).forEach((key) => {
    const typedKey = key as keyof UpdateUserDTO;
    if (updateData[typedKey] !== undefined && updateData[typedKey] !== user[typedKey as keyof User]) {
      changedFields.push(key);
    }
  });

  Object.assign(user, updateData);
  const savedUser = await userRepository.save(user);

  logger.info('User updated', {
    type: 'user_updated',
    userId: savedUser.id,
    changedFields,
    duration: Date.now() - startTime,
  });

  // Publish role changed event if role changed
  if (updateData.role && updateData.role !== oldRole) {
    logger.info('User role changed', {
      type: 'user_role_changed',
      userId: savedUser.id,
      oldRole,
      newRole: savedUser.role,
    });
    try {
      await publishUserRoleChanged(savedUser.id, savedUser.subject, oldRole, savedUser.role);
      logger.info('Event published - user.role_changed', {
        type: 'event_published',
        eventType: 'user.role_changed',
        userId: savedUser.id,
      });
    } catch (error) {
      logger.error('Failed to publish user.role_changed event', {
        type: 'event_publish_failed',
        eventType: 'user.role_changed',
        userId: savedUser.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Publish status changed event if status changed
  if (updateData.status && updateData.status !== oldStatus) {
    logger.info('User status changed', {
      type: 'user_status_changed',
      userId: savedUser.id,
      oldStatus,
      newStatus: savedUser.status,
    });
    try {
      await publishUserStatusChanged(savedUser.id, savedUser.subject, oldStatus, savedUser.status);
      logger.info('Event published - user.status_changed', {
        type: 'event_published',
        eventType: 'user.status_changed',
        userId: savedUser.id,
      });
    } catch (error) {
      logger.error('Failed to publish user.status_changed event', {
        type: 'event_publish_failed',
        eventType: 'user.status_changed',
        userId: savedUser.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Publish user updated event
  if (changedFields.length > 0) {
    try {
      await publishUserUpdated(
        savedUser.id,
        savedUser.subject,
        savedUser.email,
        savedUser.firstName,
        savedUser.lastName,
        savedUser.displayName,
        savedUser.organizationId,
        changedFields,
      );
      logger.info('Event published - user.updated', {
        type: 'event_published',
        eventType: 'user.updated',
        userId: savedUser.id,
        changedFields,
      });
    } catch (error) {
      logger.error('Failed to publish user.updated event', {
        type: 'event_publish_failed',
        eventType: 'user.updated',
        userId: savedUser.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return savedUser;
};

export const deleteUser = async (id: string): Promise<void> => {
  const startTime = Date.now();
  const userRepository = getUserRepository();
  const user = await getUserById(id);
  
  await userRepository.remove(user);

  logger.info('User deleted', {
    type: 'user_deleted',
    userId: id,
    email: user.email,
    duration: Date.now() - startTime,
  });
};

export const getUserStatistics = async () => {
  const userRepository = getUserRepository();
  const [total, active, inactive, suspended] = await Promise.all([
    userRepository.count(),
    userRepository.count({ where: { status: UserStatus.ACTIVE } }),
    userRepository.count({ where: { status: UserStatus.INACTIVE } }),
    userRepository.count({ where: { status: UserStatus.SUSPENDED } }),
  ]);

  return {
    total,
    byStatus: { active, inactive, suspended },
  };
};

// gRPC handlers

export const getUserGrpc = async (
  call: { request: { user_id: string } },
  callback: grpc.sendUnaryData<unknown>,
) => {
  try {
    const { user_id } = call.request;

    if (!user_id) {
      const error = new Error('user_id is required') as grpc.ServiceError;
      error.code = grpc.status.INVALID_ARGUMENT;
      return callback(error);
    }

    const user = await getUserById(user_id);

    callback(null, {
      user: mapUserToProto(user),
    });
  } catch (error) {
    logger.error('gRPC GetUser error:', error);
    const grpcError = new Error('Failed to fetch user') as grpc.ServiceError;
    grpcError.code = grpc.status.INTERNAL;
    callback(grpcError);
  }
};

export const getUserBySubjectGrpc = async (
  call: { request: { subject: string } },
  callback: grpc.sendUnaryData<unknown>,
) => {
  try {
    const { subject } = call.request;

    if (!subject) {
      const error = new Error('subject is required') as grpc.ServiceError;
      error.code = grpc.status.INVALID_ARGUMENT;
      return callback(error);
    }

    const user = await getUserBySubject(subject);

    callback(null, {
      user: mapUserToProto(user),
    });
  } catch (error) {
    logger.error('gRPC GetUserBySubject error:', error);
    const grpcError = new Error('Failed to fetch user') as grpc.ServiceError;
    grpcError.code = grpc.status.NOT_FOUND;
    callback(grpcError);
  }
};

export const getUsersGrpc = async (
  call: { request: { user_ids: string[] } },
  callback: grpc.sendUnaryData<unknown>,
) => {
  try {
    const { user_ids } = call.request;

    const users = await getUsersByIds(user_ids || []);

    callback(null, {
      users: users.map(mapUserToProto),
      total: users.length,
    });
  } catch (error) {
    logger.error('gRPC GetUsers error:', error);
    const grpcError = new Error('Failed to fetch users') as grpc.ServiceError;
    grpcError.code = grpc.status.INTERNAL;
    callback(grpcError);
  }
};

export const syncUserGrpc = async (
  call: { request: { subject: string; email: string; first_name?: string; last_name?: string; display_name?: string; avatar_url?: string; organization_id?: string; claims?: Record<string, string> } },
  callback: grpc.sendUnaryData<unknown>,
) => {
  try {
    const { subject, email, first_name, last_name, display_name, avatar_url, organization_id, claims } = call.request;

    if (!subject || !email) {
      const error = new Error('subject and email are required') as grpc.ServiceError;
      error.code = grpc.status.INVALID_ARGUMENT;
      return callback(error);
    }

    let user = await getUserBySubject(subject).catch(() => null);
    const isNewUser = !user;

    if (user) {
      user = await updateUser(user.id, {
        firstName: first_name,
        lastName: last_name,
        displayName: display_name,
        avatarUrl: avatar_url,
        organizationId: organization_id,
        metadata: claims,
      });
    } else {
      user = await createUser({
        subject,
        email,
        firstName: first_name,
        lastName: last_name,
        displayName: display_name,
        avatarUrl: avatar_url,
        organizationId: organization_id,
        metadata: claims,
      });
    }

    callback(null, {
      user: mapUserToProto(user),
      is_new_user: isNewUser,
    });
  } catch (error) {
    logger.error('gRPC SyncUser error:', error);
    const grpcError = new Error('Failed to sync user') as grpc.ServiceError;
    grpcError.code = grpc.status.INTERNAL;
    callback(grpcError);
  }
};

export const getUsersByOrganizationGrpc = async (
  call: { request: { organization_id: string; page?: number; page_size?: number } },
  callback: grpc.sendUnaryData<unknown>,
) => {
  try {
    const { organization_id, page = 1, page_size = 20 } = call.request;

    if (!organization_id) {
      const error = new Error('organization_id is required') as grpc.ServiceError;
      error.code = grpc.status.INVALID_ARGUMENT;
      return callback(error);
    }

    const { users, total } = await getUsersByOrganization(organization_id, page, page_size);

    callback(null, {
      users: users.map(mapUserToProto),
      total,
    });
  } catch (error) {
    logger.error('gRPC GetUsersByOrganization error:', error);
    const grpcError = new Error('Failed to fetch users') as grpc.ServiceError;
    grpcError.code = grpc.status.INTERNAL;
    callback(grpcError);
  }
};

// Helper function to map User to proto format
function mapUserToProto(user: User) {
  return {
    id: user.id,
    subject: user.subject,
    email: user.email,
    first_name: user.firstName || '',
    last_name: user.lastName || '',
    display_name: user.displayName || '',
    avatar_url: user.avatarUrl || '',
    role: mapRoleToProto(user.role),
    status: mapStatusToProto(user.status),
    organization_id: user.organizationId || '',
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
    metadata: user.metadata || {},
  };
}

function mapRoleToProto(role: UserRole): number {
  switch (role) {
    case UserRole.USER:
      return 1;
    case UserRole.ADMIN:
      return 2;
    case UserRole.MANAGER:
      return 3;
    default:
      return 0;
  }
}

function mapStatusToProto(status: UserStatus): number {
  switch (status) {
    case UserStatus.ACTIVE:
      return 1;
    case UserStatus.INACTIVE:
      return 2;
    case UserStatus.SUSPENDED:
      return 3;
    default:
      return 0;
  }
}









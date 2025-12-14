import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import logger from '../utils/logger';
import {
  getUserGrpc,
  getUserBySubjectGrpc,
  getUsersGrpc,
  syncUserGrpc,
  getUsersByOrganizationGrpc,
} from '../services/user.service';
import { asgardeoService } from '../services/asgardeo.service';

interface UserProtoNamespace {
  UserService: {
    service: grpc.ServiceDefinition;
  };
}

const PROTO_PATH = path.resolve(__dirname, '../../proto/user.proto');

/**
 * Validate token via gRPC
 */
const validateTokenGrpc = async (
  call: { request: { access_token: string } },
  callback: grpc.sendUnaryData<unknown>,
) => {
  try {
    const { access_token } = call.request;

    if (!access_token) {
      const error = new Error('access_token is required') as grpc.ServiceError;
      error.code = grpc.status.INVALID_ARGUMENT;
      return callback(error);
    }

    const payload = await asgardeoService.validateToken(access_token);

    if (!payload || !payload.sub) {
      callback(null, {
        valid: false,
        user: null,
        scopes: [],
        expires_at: 0,
      });
      return;
    }

    const email = (payload.email || payload.username || payload.preferred_username || payload.upn || payload.sub) as string;

    let roles: string[] = [];
    if (payload.roles) {
      roles = Array.isArray(payload.roles) ? payload.roles as string[] : [payload.roles as string];
    } else if (payload.groups) {
      roles = Array.isArray(payload.groups) ? payload.groups as string[] : [payload.groups as string];
    }
    const user = await asgardeoService.syncUser({
      subject: payload.sub as string,
      email: email,
      firstName: payload.given_name as string | undefined,
      lastName: payload.family_name as string | undefined,
      displayName: payload.name as string | undefined,
      avatarUrl: payload.picture as string | undefined,
      organizationId: payload.org_id as string | undefined,
      roles: roles,
    });

    callback(null, {
      valid: true,
      user: {
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
      },
      scopes: payload.scope ? (payload.scope as string).split(' ') : [],
      expires_at: payload.exp || 0,
    });
  } catch (error) {
    logger.error('gRPC ValidateToken error:', error);
    callback(null, {
      valid: false,
      user: null,
      scopes: [],
      expires_at: 0,
    });
  }
};

function mapRoleToProto(role: string): number {
  switch (role) {
    case 'user':
      return 1;
    case 'admin':
      return 2;
    case 'manager':
      return 3;
    default:
      return 0;
  }
}

function mapStatusToProto(status: string): number {
  switch (status) {
    case 'active':
      return 1;
    case 'inactive':
      return 2;
    case 'suspended':
      return 3;
    default:
      return 0;
  }
}

export const startGrpcServer = (port: number = 50053): grpc.Server => {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const userProto = grpc.loadPackageDefinition(packageDefinition)
    .user as unknown as UserProtoNamespace;

  const server = new grpc.Server();

  server.addService(userProto.UserService.service, {
    GetUser: getUserGrpc,
    GetUserBySubject: getUserBySubjectGrpc,
    GetUsers: getUsersGrpc,
    SyncUser: syncUserGrpc,
    ValidateToken: validateTokenGrpc,
    GetUsersByOrganization: getUsersByOrganizationGrpc,
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        logger.error('Failed to start gRPC server:', error);
        throw error;
      }
      logger.info(`User gRPC server running on port ${boundPort}`);
    },
  );

  return server;
};

/**
 * Gracefully shutdown gRPC server
 */
export const shutdownGrpcServer = (server: grpc.Server): Promise<void> => {
  return new Promise((resolve) => {
    server.tryShutdown(() => {
      logger.info('gRPC server shut down gracefully');
      resolve();
    });
  });
};


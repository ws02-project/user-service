import path from 'path';
import { EventBus } from './EventBus';
import { config } from '../config';
import logger from '../utils/logger';

// Global EventBus instance
export let eventBus: EventBus;

/**
 * Initialize the messaging system
 */
export const initializeMessaging = async (): Promise<void> => {
  eventBus = new EventBus(config.serviceName);

  // Initialize connection
  await eventBus.initialize(config.rabbitmq.url);

  // Load protobuf schemas
  const protoPath = path.resolve(__dirname, '../../proto/user.proto');
  await eventBus.loadProtoSchema(protoPath);

  // Register service with queues and subscriptions
  await eventBus.registerService({
    serviceName: config.serviceName,
    queues: [
      {
        name: `${config.serviceName}.events`,
        durable: true,
        deadLetterQueue: `${config.serviceName}.dlq`,
      },
    ],
    subscriptions: [
      // Subscribe to events from other services if needed
      // Example: listen to project.created events
      // { eventType: 'project.created', routingKey: 'project.created' },
    ],
  });

  // Start consuming messages
  await eventBus.startConsuming();

  logger.info('✅ Messaging system initialized');
};

/**
 * Close the messaging system
 */
export const closeMessaging = async (): Promise<void> => {
  if (eventBus) {
    await eventBus.close();
  }
};

/**
 * Publish user.created event
 */
export const publishUserCreated = async (
  userId: string,
  subject: string,
  email: string,
  firstName?: string,
  lastName?: string,
  displayName?: string,
  organizationId?: string,
): Promise<void> => {
  await eventBus.publish('user.created', 'user.created', 'user.UserCreatedEvent', {
    user_id: userId,
    subject,
    email,
    first_name: firstName || '',
    last_name: lastName || '',
    display_name: displayName || '',
    organization_id: organizationId || '',
    created_at: new Date().toISOString(),
  });
};

/**
 * Publish user.updated event
 */
export const publishUserUpdated = async (
  userId: string,
  subject: string,
  email: string,
  firstName?: string,
  lastName?: string,
  displayName?: string,
  organizationId?: string,
  changedFields?: string[],
): Promise<void> => {
  await eventBus.publish('user.updated', 'user.updated', 'user.UserUpdatedEvent', {
    user_id: userId,
    subject,
    email,
    first_name: firstName || '',
    last_name: lastName || '',
    display_name: displayName || '',
    organization_id: organizationId || '',
    updated_at: new Date().toISOString(),
    changed_fields: changedFields || [],
  });
};

/**
 * Publish user.role_changed event
 */
export const publishUserRoleChanged = async (
  userId: string,
  subject: string,
  oldRole: string,
  newRole: string,
  changedBy?: string,
): Promise<void> => {
  // Map role strings to proto enum values
  const roleMap: Record<string, number> = {
    user: 1,
    admin: 2,
    manager: 3,
  };

  await eventBus.publish('user.role_changed', 'user.role_changed', 'user.UserRoleChangedEvent', {
    user_id: userId,
    subject,
    old_role: roleMap[oldRole] || 0,
    new_role: roleMap[newRole] || 0,
    changed_by: changedBy || '',
    changed_at: new Date().toISOString(),
  });
};

/**
 * Publish user.status_changed event
 */
export const publishUserStatusChanged = async (
  userId: string,
  subject: string,
  oldStatus: string,
  newStatus: string,
  reason?: string,
  changedBy?: string,
): Promise<void> => {
  // Map status strings to proto enum values
  const statusMap: Record<string, number> = {
    active: 1,
    inactive: 2,
    suspended: 3,
  };

  await eventBus.publish('user.status_changed', 'user.status_changed', 'user.UserStatusChangedEvent', {
    user_id: userId,
    subject,
    old_status: statusMap[oldStatus] || 0,
    new_status: statusMap[newStatus] || 0,
    reason: reason || '',
    changed_by: changedBy || '',
    changed_at: new Date().toISOString(),
  });
};

export { EventBus };












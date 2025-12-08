import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { config } from '../config';
import logger from '../utils/logger';
import { User, SyncUserDTO, UserStatus, UserRole } from '../models/user.model';
import * as userService from './user.service';

/**
 * Asgardeo Service - Handles JWT validation and user synchronization
 * Uses JWKS for token validation (more secure than client secret)
 */
export class AsgardeoService {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private jwksInitialized = false;

  constructor() {
    this.initializeJWKS();
  }

  /**
   * Initialize JWKS (JSON Web Key Set) for token validation
   */
  private async initializeJWKS(): Promise<void> {
    try {
      if (!config.asgardeo.jwksUri || config.asgardeo.jwksUri.includes('{org_name}')) {
        logger.warn('⚠️ Asgardeo JWKS URI not configured. Token validation will fail.');
        return;
      }

      this.jwks = createRemoteJWKSet(new URL(config.asgardeo.jwksUri), {
        cacheMaxAge: config.asgardeo.jwksCacheMaxAge,
      });
      this.jwksInitialized = true;
      logger.info('✅ Asgardeo JWKS initialized');
    } catch (error) {
      logger.error('Failed to initialize Asgardeo JWKS:', error);
    }
  }

  /**
   * Validate JWT token from Asgardeo
   * Returns the decoded payload if valid, throws error otherwise
   */
  async validateToken(token: string): Promise<JWTPayload> {
    if (!this.jwksInitialized || !this.jwks) {
      // Try to initialize if not done
      await this.initializeJWKS();
      if (!this.jwks) {
        throw new Error('Asgardeo JWKS not configured');
      }
    }

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: config.asgardeo.issuer,
        audience: config.asgardeo.audience || undefined,
      });

      logger.debug('Token validated successfully for subject:', payload.sub);
      return payload;
    } catch (error: any) {
      logger.error('Token validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Map Asgardeo roles to local UserRole enum
   * Returns USER if no special role is found (default role)
   */
  private mapAsgardeoRole(roles?: string[]): UserRole {
    if (!roles || roles.length === 0) return UserRole.USER;
    
    // Normalize roles to lowercase for comparison
    const normalizedRoles = roles.map(r => r.toLowerCase().trim());
    
    // Check for admin role (various possible names)
    if (normalizedRoles.some(r => ['admin', 'administrator', 'internal/admin'].includes(r))) {
      return UserRole.ADMIN;
    }
    
    // Check for manager role
    if (normalizedRoles.some(r => ['manager', 'internal/manager'].includes(r))) {
      return UserRole.MANAGER;
    }
    
    // Default to user
    return UserRole.USER;
  }

  /**
   * Sync user from Asgardeo claims to local database
   * Creates user if not exists, updates if exists
   */
  async syncUser(data: SyncUserDTO): Promise<User> {
    try {
      // Try to find existing user by subject (Asgardeo user ID)
      let user = await userService.getUserBySubject(data.subject).catch(() => null);

      // Map Asgardeo roles to local role
      const mappedRole = this.mapAsgardeoRole(data.roles);

      if (user) {
        // Update existing user with latest claims
        const updates: Partial<User> = {};
        
        if (data.email && data.email !== user.email) {
          updates.email = data.email;
        }
        if (data.firstName && data.firstName !== user.firstName) {
          updates.firstName = data.firstName;
        }
        if (data.lastName && data.lastName !== user.lastName) {
          updates.lastName = data.lastName;
        }
        if (data.displayName && data.displayName !== user.displayName) {
          updates.displayName = data.displayName;
        }
        if (data.avatarUrl && data.avatarUrl !== user.avatarUrl) {
          updates.avatarUrl = data.avatarUrl;
        }
        if (data.organizationId && data.organizationId !== user.organizationId) {
          updates.organizationId = data.organizationId;
        }
        // Always sync role from Asgardeo (downgrade if role removed)
        if (mappedRole !== user.role) {
          updates.role = mappedRole;
          logger.info(`User role synced from Asgardeo: ${user.role} -> ${mappedRole}`);
        }

        // Update last login
        updates.lastLoginAt = new Date();

        if (Object.keys(updates).length > 0) {
          user = await userService.updateUser(user.id, updates);
          logger.debug('User synced (updated):', user.id);
        }
      } else {
        // Create new user with role from Asgardeo
        user = await userService.createUser({
          subject: data.subject,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
          avatarUrl: data.avatarUrl,
          organizationId: data.organizationId,
          role: mappedRole,
          metadata: data.claims,
        });
        logger.info('New user created from Asgardeo:', user.id);
      }

      return user;
    } catch (error) {
      logger.error('Failed to sync user:', error);
      throw error;
    }
  }

  /**
   * Check if user is active (not suspended or inactive)
   */
  async isUserActive(subject: string): Promise<boolean> {
    try {
      const user = await userService.getUserBySubject(subject);
      return user.status === UserStatus.ACTIVE;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const asgardeoService = new AsgardeoService();


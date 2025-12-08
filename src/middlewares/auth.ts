import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import createApiError from '../utils/ApiError';
import logger from '../utils/logger';
import { AsgardeoService } from '../services/asgardeo.service';
import { User, UserRole } from '../models/user.model';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      tokenPayload?: {
        sub: string;
        email?: string;
        given_name?: string;
        family_name?: string;
        name?: string;
        picture?: string;
        org_id?: string;
        scopes?: string[];
        exp?: number;
        iat?: number;
        iss?: string;
        aud?: string | string[];
        [key: string]: unknown;
      };
    }
  }
}

const asgardeoService = new AsgardeoService();

/**
 * Authenticate middleware - validates JWT token from Asgardeo
 * Extracts user info from token and syncs with database
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createApiError(httpStatus.UNAUTHORIZED, 'No access token provided');
    }

    const token = authHeader.substring(7);

    // Validate token and get payload
    const payload = await asgardeoService.validateToken(token);

    if (!payload || !payload.sub) {
      throw createApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
    }

    // Extract email - Asgardeo ID tokens use 'username' field for email
    const email = (payload.email || payload.username) as string;
    
    // Store token payload in request
    req.tokenPayload = {
      sub: payload.sub as string,
      email: email,
      given_name: payload.given_name as string | undefined,
      family_name: payload.family_name as string | undefined,
      name: payload.name as string | undefined,
      picture: payload.picture as string | undefined,
      org_id: payload.org_id as string | undefined,
      scopes: payload.scope ? (payload.scope as string).split(' ') : [],
      exp: payload.exp as number | undefined,
      iat: payload.iat as number | undefined,
      iss: payload.iss as string | undefined,
      aud: payload.aud as string | string[] | undefined,
    };

    // Extract roles from token (Asgardeo uses 'roles' or 'groups' claim)
    let roles: string[] = [];
    if (payload.roles) {
      roles = Array.isArray(payload.roles) ? payload.roles as string[] : [payload.roles as string];
    } else if (payload.groups) {
      roles = Array.isArray(payload.groups) ? payload.groups as string[] : [payload.groups as string];
    }

    // Sync user with database (creates if not exists, updates if exists)
    // Always pass roles array (even if empty) to allow role downgrade
    const user = await asgardeoService.syncUser({
      subject: payload.sub as string,
      email: email,
      firstName: payload.given_name as string | undefined,
      lastName: payload.family_name as string | undefined,
      displayName: payload.name as string | undefined,
      avatarUrl: payload.picture as string | undefined,
      organizationId: (payload.org_id || payload.org_handle) as string | undefined,
      roles: roles,
    });

    req.user = user;
    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    if (error.statusCode) {
      next(error);
    } else if (error.message?.includes('expired')) {
      next(createApiError(httpStatus.UNAUTHORIZED, 'Token has expired'));
    } else if (error.message?.includes('invalid')) {
      next(createApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
    } else {
      next(createApiError(httpStatus.UNAUTHORIZED, 'Authentication failed'));
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for public endpoints that have enhanced functionality for authenticated users
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const payload = await asgardeoService.validateToken(token);

    if (payload && payload.sub) {
      const email = (payload.email || payload.username) as string;
      
      req.tokenPayload = {
        sub: payload.sub as string,
        email: email,
        given_name: payload.given_name as string | undefined,
        family_name: payload.family_name as string | undefined,
        name: payload.name as string | undefined,
        picture: payload.picture as string | undefined,
        org_id: payload.org_id as string | undefined,
        scopes: payload.scope ? (payload.scope as string).split(' ') : [],
      };

      // Extract roles from token
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
        organizationId: (payload.org_id || payload.org_handle) as string | undefined,
        roles: roles,
      });

      req.user = user;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    logger.warn('Optional auth failed:', error);
    next();
  }
};

/**
 * Authorize middleware - checks if user has required role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createApiError(httpStatus.UNAUTHORIZED, 'Not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(createApiError(httpStatus.FORBIDDEN, 'Insufficient permissions'));
    }

    next();
  };
};

/**
 * Check if user has specific scope
 */
export const requireScope = (...requiredScopes: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.tokenPayload?.scopes) {
      return next(createApiError(httpStatus.FORBIDDEN, 'No scopes in token'));
    }

    const hasAllScopes = requiredScopes.every((scope) => req.tokenPayload!.scopes!.includes(scope));

    if (!hasAllScopes) {
      return next(createApiError(httpStatus.FORBIDDEN, `Required scopes: ${requiredScopes.join(', ')}`));
    }

    next();
  };
};


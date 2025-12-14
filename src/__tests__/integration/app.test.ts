import express, { Express, Request, Response, NextFunction } from 'express';
import request from 'supertest';
import httpStatus from 'http-status';
import { User, UserRole, UserStatus } from '../../models/user.model';

// Create a test app that simulates the real app structure
function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Add requestId middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.requestId = 'test-req-id';
    next();
  });

  // Mock user for authenticated routes
  const mockUser: User = {
    id: 'user-uuid-1234',
    subject: 'asgardeo-sub-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
  };

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'user-service' });
  });

  // API routes
  app.get('/api/v1/users/me', (req: Request, res: Response) => {
    if (!req.headers.authorization) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'No access token provided',
      });
    }
    res.json({ success: true, data: mockUser });
  });

  app.get('/api/v1/users', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: [mockUser],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  app.get('/api/v1/users/:id', (req: Request, res: Response) => {
    if (req.params.id === 'nonexistent') {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }
    res.json({ success: true, data: mockUser });
  });

  app.patch('/api/v1/users/:id', (req: Request, res: Response) => {
    res.json({ success: true, data: { ...mockUser, ...req.body } });
  });

  app.delete('/api/v1/users/:id', (_req: Request, res: Response) => {
    res.status(httpStatus.NO_CONTENT).send();
  });

  app.get('/api/v1/users/statistics', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: { total: 100, byStatus: { active: 80, inactive: 15, suspended: 5 } },
    });
  });

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Not found',
    });
  });

  return app;
}

describe('User Service App', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        service: 'user-service',
      });
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/v1/users/me');

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should return current user with token', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return list of users', async () => {
      const response = await request(app).get('/api/v1/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by id', async () => {
      const response = await request(app).get('/api/v1/users/user-uuid-1234');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/api/v1/users/nonexistent');

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update user', async () => {
      const response = await request(app)
        .patch('/api/v1/users/user-uuid-1234')
        .send({ firstName: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user', async () => {
      const response = await request(app).delete('/api/v1/users/user-uuid-1234');

      expect(response.status).toBe(httpStatus.NO_CONTENT);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/v1/unknown-route');

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
  });
});



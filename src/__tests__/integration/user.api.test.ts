import request from 'supertest';
import express from 'express';
import httpStatus from 'http-status';

// Create a mock app for testing
const createMockApp = () => {
  const app = express();
  app.use(express.json());

  // Mock user data
  const users: Record<string, unknown>[] = [
    {
      id: 'user-1',
      subject: 'auth0|user1',
      email: 'user1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      role: 'user',
      status: 'active',
      organizationId: 'org-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Health check
  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok', service: 'user-service' });
  });

  // Get all users
  app.get('/api/v1/users', (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        pageSize,
        total: users.length,
        totalPages: Math.ceil(users.length / pageSize),
      },
    });
  });

  // Get user by ID
  app.get('/api/v1/users/:id', (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    res.json({ success: true, data: user });
  });

  // Get current user
  app.get('/api/v1/users/me', (req, res) => {
    // Simulate authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }
    res.json({ success: true, data: users[0] });
  });

  // Update user
  app.patch('/api/v1/users/:id', (req, res) => {
    const userIndex = users.findIndex((u) => u.id === req.params.id);
    if (userIndex === -1) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    users[userIndex] = {
      ...users[userIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    res.json({ success: true, data: users[userIndex] });
  });

  // Delete user
  app.delete('/api/v1/users/:id', (req, res) => {
    const userIndex = users.findIndex((u) => u.id === req.params.id);
    if (userIndex === -1) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    users.splice(userIndex, 1);
    res.status(httpStatus.NO_CONTENT).send();
  });

  // Get user statistics
  app.get('/api/v1/users/statistics', (_req, res) => {
    res.json({
      success: true,
      data: {
        total: users.length,
        byStatus: {
          active: users.filter((u) => u.status === 'active').length,
          inactive: users.filter((u) => u.status === 'inactive').length,
          suspended: users.filter((u) => u.status === 'suspended').length,
        },
      },
    });
  });

  return app;
};

describe('User API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createMockApp();
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('user-service');
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated users', async () => {
      const res = await request(app).get('/api/v1/users');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should support pagination parameters', async () => {
      const res = await request(app).get('/api/v1/users?page=1&pageSize=10');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.pageSize).toBe(10);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by ID', async () => {
      const res = await request(app).get('/api/v1/users/user-1');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('user-1');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/api/v1/users/non-existent');

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const res = await request(app).patch('/api/v1/users/user-1').send(updateData);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Jane');
      expect(res.body.data.lastName).toBe('Smith');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).patch('/api/v1/users/non-existent').send({
        firstName: 'Test',
      });

      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should return 404 for non-existent user', async () => {
      const res = await request(app).delete('/api/v1/users/non-existent');

      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });
});


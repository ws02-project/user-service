import { Router, Request, Response } from 'express';
import userRoutes from './user.routes';

const router: Router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/users', userRoutes);

export default router;









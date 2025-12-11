import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import validate from '../middlewares/validate';
import * as userValidation from '../validations/user.validation';
import { authenticate, authorize } from '../middlewares/auth';
import { UserRole } from '../models/user.model';

const router: Router = Router();

// Public routes (require authentication but not specific role)
router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, validate(userValidation.updateMeSchema), userController.updateMe);

// Admin routes
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(userValidation.paginationSchema),
  userController.getAllUsers,
);

router.get(
  '/statistics',
  authenticate,
  authorize(UserRole.ADMIN),
  userController.getUserStatistics,
);

router.get(
  '/organization/:organizationId',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(userValidation.getUsersByOrganizationSchema),
  userController.getUsersByOrganization,
);

router.get(
  '/subject/:subject',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(userValidation.getUserBySubjectSchema),
  userController.getUserBySubject,
);

router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validate(userValidation.getUserSchema),
  userController.getUserById,
);

router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(userValidation.updateUserSchema),
  userController.updateUser,
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(userValidation.deleteUserSchema),
  userController.deleteUser,
);

export default router;









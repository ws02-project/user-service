import Joi from 'joi';
import { UserRole, UserStatus } from '../models/user.model';

export const getUserSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
});

export const getUserBySubjectSchema = Joi.object({
  params: Joi.object({
    subject: Joi.string().required(),
  }),
});

export const getUsersByOrganizationSchema = Joi.object({
  params: Joi.object({
    organizationId: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
  }),
});

export const updateMeSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().max(100).allow(''),
    lastName: Joi.string().max(100).allow(''),
    displayName: Joi.string().max(200).allow(''),
    avatarUrl: Joi.string().uri().max(500).allow(''),
  }),
});

export const updateUserSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    firstName: Joi.string().max(100).allow(''),
    lastName: Joi.string().max(100).allow(''),
    displayName: Joi.string().max(200).allow(''),
    avatarUrl: Joi.string().uri().max(500).allow(''),
    role: Joi.string().valid(...Object.values(UserRole)),
    status: Joi.string().valid(...Object.values(UserStatus)),
    organizationId: Joi.string().uuid().allow(null),
    metadata: Joi.object().pattern(Joi.string(), Joi.string()),
  }),
});

export const deleteUserSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
});

export const paginationSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
  }),
});









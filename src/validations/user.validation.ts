import Joi from 'joi';
import { UserRole, UserStatus } from '../models/user.model';

export const getUserSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const getUserBySubjectSchema = {
  params: Joi.object({
    subject: Joi.string().required(),
  }),
};

export const getUsersByOrganizationSchema = {
  params: Joi.object({
    organizationId: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
  }),
};

export const updateMeSchema = {
  body: Joi.object({
    firstName: Joi.string().max(100).allow(''),
    lastName: Joi.string().max(100).allow(''),
    displayName: Joi.string().max(200).allow(''),
    avatarUrl: Joi.string().uri().max(500).allow(''),
  }),
};

export const updateUserSchema = {
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
};

export const deleteUserSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const paginationSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
  }),
};

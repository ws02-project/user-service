import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';
import httpStatus from 'http-status';
import createApiError from '../utils/ApiError';

const validate = (schema: Joi.ObjectSchema): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const validSchema = Object.keys(schema.describe().keys);
    const object = validSchema.reduce((obj: Record<string, unknown>, key: string) => {
      if (Object.prototype.hasOwnProperty.call(req, key)) {
        obj[key] = (req as unknown as Record<string, unknown>)[key];
      }
      return obj;
    }, {});

    const { value, error } = schema
      .prefs({ errors: { label: 'key' }, abortEarly: false })
      .validate(object);

    if (error) {
      const errorMessage = error.details.map((details) => details.message).join(', ');
      next(createApiError(httpStatus.BAD_REQUEST, errorMessage));
      return;
    }

    Object.assign(req, value);
    next();
  };
};

export default validate;


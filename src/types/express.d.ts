import { User } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      requestId?: string;
      traceId?: string;
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

export {};









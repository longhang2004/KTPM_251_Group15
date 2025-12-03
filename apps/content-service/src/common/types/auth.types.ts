import { Request } from 'express';

/**
 * Authenticated user object structure from JWT strategy
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/**
 * Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

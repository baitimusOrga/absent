/**
 * Enhanced authentication middleware with better error handling
 */

import { Request, Response, NextFunction } from 'express';
import { auth } from '../services/auth';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Middleware to require authentication for protected routes
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session) {
      throw new UnauthorizedError('Valid session required', 'SESSION_REQUIRED');
    }

    // Attach session and user to request for downstream handlers
    req.session = session.session;
    req.user = session.user;

    logger.debug('User authenticated', {
      userId: session.user.id,
      path: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
    });

    next(new UnauthorizedError('Authentication failed', 'AUTH_FAILED'));
  }
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      throw new UnauthorizedError('Authentication required', 'AUTH_REQUIRED');
    }

    // Check if user has admin role
    const user = req.user as any;
    const isAdmin = user.role === 'admin' || user.admin === true;

    if (!isAdmin) {
      logger.warn('Unauthorized admin access attempt', {
        userId: req.user.id,
        path: req.path,
      });
      
      throw new UnauthorizedError('Admin access required', 'ADMIN_REQUIRED');
    }

    logger.debug('Admin access granted', {
      userId: req.user.id,
      path: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    next(new UnauthorizedError('Authorization failed', 'AUTHZ_FAILED'));
  }
};

/**
 * Optional authentication - attaches user if authenticated but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session) {
      req.session = session.session;
      req.user = session.user;
      
      logger.debug('Optional auth - user authenticated', {
        userId: session.user.id,
      });
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    logger.debug('Optional auth - no valid session');
    next();
  }
};

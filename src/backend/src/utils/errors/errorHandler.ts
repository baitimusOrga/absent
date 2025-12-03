import type { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '../logger/index';

/**
 * Standard error response interface
 */
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

/**
 * Centralized error handler middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  let errors: Record<string, string[]> | undefined;
  let isOperational = false;

  // Handle known AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    isOperational = error.isOperational;

    // Attach validation errors if present
    if ('errors' in error) {
      errors = (error as any).errors;
    }
  }

  // Log error details
  if (isOperational) {
    logger.warn('Operational error occurred', {
      statusCode,
      message,
      code,
      errors,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error('Unexpected error occurred', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    code,
    errors,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Wrapper for async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
};

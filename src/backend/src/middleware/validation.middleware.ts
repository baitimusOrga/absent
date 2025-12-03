/**
 * Request validation middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

/**
 * Validator function type
 */
type ValidatorFunction = (data: any) => { valid: boolean; errors?: Record<string, string[]> };

/**
 * Middleware factory for request body validation
 */
export const validateBody = (validator: ValidatorFunction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validator(req.body);
    
    if (!result.valid) {
      next(new ValidationError('Request validation failed', result.errors));
      return;
    }
    
    next();
  };
};

/**
 * Middleware factory for query parameter validation
 */
export const validateQuery = (validator: ValidatorFunction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validator(req.query);
    
    if (!result.valid) {
      next(new ValidationError('Query validation failed', result.errors));
      return;
    }
    
    next();
  };
};

/**
 * Middleware factory for route parameter validation
 */
export const validateParams = (validator: ValidatorFunction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validator(req.params);
    
    if (!result.valid) {
      next(new ValidationError('Parameter validation failed', result.errors));
      return;
    }
    
    next();
  };
};

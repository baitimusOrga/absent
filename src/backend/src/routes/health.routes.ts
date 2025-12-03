/**
 * Health check routes
 */

import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';

export const healthRouter = Router();

/**
 * GET /health
 * Health check endpoint
 */
healthRouter.get('/health', healthCheck);

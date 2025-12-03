/**
 * Health check controller
 */

import type { Request, Response } from 'express';
import { getMongoStatus } from '../db';
import { ApiResponse } from '../utils/response/ApiResponse';
import { asyncHandler } from '../utils/errors';

/**
 * Health check endpoint
 * GET /health
 */
export const healthCheck = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const mongo = await getMongoStatus();
  const isHealthy = mongo.status === 'ready';

  const healthData = {
    status: isHealthy ? 'ok' : 'error',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
    services: {
      mongo,
    },
  };

  if (isHealthy) {
    ApiResponse.success(res, healthData);
  } else {
    res.status(503).json({
      success: false,
      ...healthData,
    });
  }
});

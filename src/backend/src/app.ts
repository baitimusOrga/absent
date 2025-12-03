/**
 * Express application setup and configuration
 */

import express, { Application } from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import type { AppConfig } from './config';
import { auth } from './services/auth';
import { healthRouter, pdfRouter } from './routes';
import { requestLogger } from './middleware';
import { errorHandler, notFoundHandler } from './utils/errors';
import { logger } from './utils/logger';

/**
 * Builds and configures the Express application instance
 */
export const createApp = (config: AppConfig): Application => {
  const app = express();

  logger.info('Configuring Express application...');

  // Trust proxy for production environments
  app.set('trust proxy', 1);
  
  // Disable X-Powered-By header for security
  app.disable('x-powered-by');

  // Configure CORS
  if (config.cors.enabled) {
    logger.debug('CORS enabled with specific origins', {
      origins: config.cors.allowList,
    });
    
    app.use(
      cors({
        origin: config.cors.allowList,
        credentials: true,
      })
    );
  } else {
    logger.debug('CORS enabled for all origins');
    app.use(cors());
  }

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use(requestLogger);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: config.metadata.name,
      version: config.metadata.version,
      environment: config.metadata.environment,
      timestamp: new Date().toISOString(),
    });
  });

  // Authentication routes (Better Auth)
  app.use('/api/auth', toNodeHandler(auth));

  // Application routes
  app.use(healthRouter);
  app.use(pdfRouter);

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  logger.info('Express application configured successfully');

  return app;
};

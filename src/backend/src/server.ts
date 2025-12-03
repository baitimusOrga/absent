/**
 * Server initialization and lifecycle management
 */

import 'dotenv/config';
import type { Server } from 'http';
import { createApp } from './app';
import { connectToDatabase, disconnectFromDatabase } from './db';
import { ensureProcessMetadata, loadAppConfig } from './config';
import { logger } from './utils/logger';

// Load application configuration
const config = loadAppConfig();
ensureProcessMetadata(config.metadata);

let httpServer: Server | null = null;
let isShuttingDown = false;

/**
 * Close HTTP server gracefully
 */
const closeHttpServer = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!httpServer) {
      resolve();
      return;
    }

    httpServer.close((closeError) => {
      if (closeError) {
        reject(closeError);
        return;
      }
      resolve();
    });
  });

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  try {
    // Close database connection
    await disconnectFromDatabase();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error while disconnecting from database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  try {
    // Close HTTP server
    await closeHttpServer();
    logger.info('HTTP server closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error while closing HTTP server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

/**
 * Register signal handlers for graceful shutdown
 */
const registerSignalHandlers = () => {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  
  signals.forEach((signal) => {
    process.once(signal, (receivedSignal) => {
      void gracefulShutdown(receivedSignal);
    });
  });

  logger.debug('Signal handlers registered', { signals });
};

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception - shutting down', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection - shutting down', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  process.exit(1);
});

/**
 * Start the server
 */
const startServer = async () => {
  try {
    logger.info('Starting server...', {
      environment: config.nodeEnv,
      version: config.metadata.version,
    });

    // Connect to database
    const { db } = await connectToDatabase(config.database);
    logger.info('Connected to MongoDB', { database: db.databaseName });

    // Create Express app
    const app = createApp(config);

    // Start HTTP server
    httpServer = app.listen(config.port, config.host, () => {
      logger.info(`Server listening on http://${config.host}:${config.port}`, {
        environment: config.nodeEnv,
        pid: process.pid,
      });
    });

    // Register graceful shutdown handlers
    registerSignalHandlers();
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

// Start the server
startServer();

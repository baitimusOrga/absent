/**
 * Enhanced MongoDB connection manager with retry logic and better error handling
 */

import { MongoClient, Db } from 'mongodb';
import type { DatabaseConfig } from '../config/database.config';
import { logger } from '../utils/logger';
import { ServiceUnavailableError, InternalServerError } from '../utils/errors';

/**
 * Database connection state
 */
interface DatabaseConnection {
  client: MongoClient;
  db: Db;
  isConnected: boolean;
}

let connection: DatabaseConnection | null = null;

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connect to MongoDB with retry logic
 */
export const connectToDatabase = async (
  config: DatabaseConfig
): Promise<{ client: MongoClient; db: Db }> => {
  // Return existing connection if already connected
  if (connection?.isConnected) {
    logger.debug('Using existing MongoDB connection');
    return { client: connection.client, db: connection.db };
  }

  const { uri, dbName, maxRetries, retryDelay, connectionTimeout } = config;
  let lastError: Error | null = null;

  // Attempt connection with retries
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Connecting to MongoDB (attempt ${attempt}/${maxRetries})...`, {
        database: dbName,
      });

      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: connectionTimeout,
        connectTimeoutMS: connectionTimeout,
      });

      await client.connect();
      
      // Test the connection
      const db = client.db(dbName);
      await db.command({ ping: 1 });

      connection = {
        client,
        db,
        isConnected: true,
      };

      logger.info('Successfully connected to MongoDB', {
        database: dbName,
        attempt,
      });

      return { client, db };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      logger.warn(`MongoDB connection attempt ${attempt} failed`, {
        error: lastError.message,
        attempt,
        maxRetries,
      });

      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        await sleep(retryDelay * attempt); // Exponential backoff
      }
    }
  }

  // All retry attempts failed
  const errorMessage = `Failed to connect to MongoDB after ${maxRetries} attempts`;
  logger.error(errorMessage, { lastError: lastError?.message });
  throw new ServiceUnavailableError(
    `${errorMessage}: ${lastError?.message ?? 'Unknown error'}`
  );
};

/**
 * Get the current database connection
 * Throws error if not connected
 */
export const getDatabase = (): Db => {
  if (!connection?.isConnected || !connection.db) {
    throw new InternalServerError(
      'MongoDB connection not initialized. Call connectToDatabase() first.'
    );
  }

  return connection.db;
};

/**
 * Get the MongoDB client
 * Throws error if not connected
 */
export const getMongoClient = (): MongoClient => {
  if (!connection?.isConnected || !connection.client) {
    throw new InternalServerError(
      'MongoDB client not initialized. Call connectToDatabase() first.'
    );
  }

  return connection.client;
};

/**
 * Disconnect from MongoDB gracefully
 */
export const disconnectFromDatabase = async (): Promise<void> => {
  if (!connection?.client) {
    logger.debug('No MongoDB connection to close');
    return;
  }

  try {
    await connection.client.close();
    connection = null;
    logger.info('MongoDB connection closed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error closing MongoDB connection', { error: errorMessage });
    throw new InternalServerError(`Failed to close MongoDB connection: ${errorMessage}`);
  }
};

/**
 * Check MongoDB connection status
 */
export const getMongoStatus = async (): Promise<{
  status: 'ready' | 'error';
  database?: string;
  message?: string;
}> => {
  try {
    if (!connection?.isConnected) {
      return {
        status: 'error',
        message: 'Not connected to database',
      };
    }

    const db = getDatabase();
    await db.command({ ping: 1 });

    return {
      status: 'ready',
      database: db.databaseName,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('MongoDB health check failed', { error: message });
    
    return {
      status: 'error',
      message,
    };
  }
};

/**
 * Check if database is connected
 */
export const isConnected = (): boolean => {
  return connection?.isConnected ?? false;
};

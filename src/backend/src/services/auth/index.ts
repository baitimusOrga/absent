/**
 * Better Auth configuration and initialization
 */

import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';
import { admin } from 'better-auth/plugins';
import { loadAuthConfig, loadDatabaseConfig } from '../../config';
import { logger } from '../../utils/logger';

/**
 * Get MongoDB instance for Better Auth
 * Uses separate client to avoid conflicts with main application connection
 */


const getMongoDbForAuth = () => {
  try {
    const dbConfig = loadDatabaseConfig();
    const client = new MongoClient(dbConfig.uri);
    
    logger.debug('Initializing MongoDB adapter for Better Auth', {
      database: dbConfig.dbName,
    });
    
    return client.db(dbConfig.dbName);
  } catch (error) {
    logger.error('Failed to initialize MongoDB for Better Auth', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Initialize and configure Better Auth
 */
export const auth = betterAuth({
  database: mongodbAdapter(getMongoDbForAuth()),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [admin()],
  trustedOrigins: loadAuthConfig().trustedOrigins,
  user: {
    additionalFields: {
      schulnetzCalendarUrl: {
        type: 'string',
        required: false,
      },
      fullname: {
        type: 'string',
        required: false,
      },
      school: {
        type: 'string',
        required: false,
        enum: ['BBZW', 'BBZG'],
      },
      berufsbildner: {
        type: 'string',
        required: false,
      },
      berufsbildnerEmail: {
        type: 'string',
        required: false,
      },
      berufsbildnerPhoneNumber: {
        type: 'string',
        required: false,
      },
      dateOfBirth: {
        type: 'date',
        required: false,
      },
      savePdfHistory: {
        type: 'boolean',
        required: false,
        default: true,
    },
  },
},
});

logger.info('Better Auth initialized successfully');

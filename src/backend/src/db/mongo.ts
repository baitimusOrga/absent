import { MongoClient, type Db } from 'mongodb';
import { DEFAULT_MONGO_DB_NAME, DEFAULT_MONGO_URI, type DatabaseConfig } from '../config';

let client: MongoClient | null = null;
let database: Db | null = null;

export interface MongoConnectionOptions {
  uri?: string;
  dbName?: string;
}

const resolveMongoConfig = (options: MongoConnectionOptions): DatabaseConfig => ({
  uri: options.uri ?? process.env.MONGO_URI ?? DEFAULT_MONGO_URI,
  dbName: options.dbName ?? process.env.MONGO_DB ?? DEFAULT_MONGO_DB_NAME,
});

export const connectToDatabase = async (options: MongoConnectionOptions = {}) => {
  const { uri, dbName } = resolveMongoConfig(options);

  if (client) {
    return { client, db: database ?? client.db(dbName) };
  }

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(dbName);

  return { client, db: database };
};

export const getDatabase = (): Db => {
  if (!database) {
    throw new Error('MongoDB client has not been initialized. Did you forget to call connectToDatabase()?');
  }

  return database;
};

export const disconnectFromDatabase = async () => {
  if (!client) {
    return;
  }

  await client.close();
  client = null;
  database = null;
};

export const getMongoStatus = async () => {
  try {
    const db = getDatabase();
    await db.command({ ping: 1 });
    return {
      status: 'ready' as const,
      database: db.databaseName
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'error' as const,
      message
    };
  }
};

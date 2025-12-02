import { MongoClient, type Db } from 'mongodb';
import type { DatabaseConfig } from '../config';

let client: MongoClient | null = null;
let database: Db | null = null;

export const connectToDatabase = async (options: DatabaseConfig) => {
  const { uri, dbName } = options;

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

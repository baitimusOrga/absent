import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

const getMongoDbForAuth = () => {
  const uri = process.env.MONGO_URI ?? 'mongodb://absent:absent@mongo:27017/absent?authSource=admin';
  const dbName = process.env.MONGO_DB ?? 'absent';
  const client = new MongoClient(uri);
  return client.db(dbName);
};

export const auth = betterAuth({
  database: mongodbAdapter(getMongoDbForAuth()),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? [],
});

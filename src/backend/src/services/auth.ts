import { betterAuth, date } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';
import { admin } from 'better-auth/plugins';

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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    admin(),
  ],
  trustedOrigins: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? [],
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
    },
  },
});

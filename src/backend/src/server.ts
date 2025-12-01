import 'dotenv/config';
import type { Server } from 'http';
import { createApp } from './app';
import packageJson from '../package.json';
import { connectToDatabase, disconnectFromDatabase } from './db/mongo';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

// Ensure the metadata is set even when running with bare environment files.
process.env.APP_VERSION = process.env.APP_VERSION ?? packageJson.version;
process.env.APP_NAME = process.env.APP_NAME ?? packageJson.name;

const startServer = async () => {
  const { db } = await connectToDatabase();
  console.log(`Connected to MongoDB database ${db.databaseName}`);

  const app = createApp();

  const server: Server = app.listen(port, host, () => {
    console.log(`API listening on http://${host}:${port}`);
  });

  let isShuttingDown = false;

  const gracefulShutdown = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}. Closing HTTP server and MongoDB connection.`);

    await disconnectFromDatabase();

    server.close((closeError) => {
      if (closeError) {
        console.error('Error while closing HTTP server', closeError);
        process.exit(1);
      }

      console.log('HTTP server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.once('SIGINT', gracefulShutdown);
  process.once('SIGTERM', gracefulShutdown);
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

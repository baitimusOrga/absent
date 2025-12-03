import 'dotenv/config';
import type { Server } from 'http';
import { createApp } from './app';
import { connectToDatabase, disconnectFromDatabase } from './db/mongo';
import { ensureProcessMetadata, loadAppConfig } from './config';

const config = loadAppConfig();
ensureProcessMetadata(config.metadata);

let httpServer: Server | null = null;
let isShuttingDown = false;

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

const gracefulShutdown = async (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}. Closing HTTP server and MongoDB connection.`);

  try {
    await disconnectFromDatabase();
  } catch (error) {
    console.error('Error while disconnecting from MongoDB', error);
  }

  try {
    await closeHttpServer();
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  } catch (error) {
    console.error('Error while closing HTTP server', error);
    process.exit(1);
  }
};

const registerSignalHandlers = () => {
  (['SIGINT', 'SIGTERM'] as const).forEach((signal) => {
    process.once(signal, (receivedSignal) => {
      void gracefulShutdown(receivedSignal);
    });
  });
};

const startServer = async () => {
  const { db } = await connectToDatabase(config.database);
  console.log(`Connected to MongoDB database ${db.databaseName}`);

  const app = createApp(config);

  httpServer = app.listen(config.port, config.host, () => {
    console.log(`API listening on http://${config.host}:${config.port}`);
  });

  registerSignalHandlers();
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

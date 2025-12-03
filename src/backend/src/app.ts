import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import type { AppConfig } from './config';
import { auth } from './auth';
import { toNodeHandler } from 'better-auth/node';

/**
 * Builds and configures the Express application instance.
 */
export const createApp = (config: AppConfig): Application => {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  if (config.cors.enabled) {
    // Only allow known origins when running in production. CORS is wide open in other environments.
    app.use(
      cors({
        origin: config.cors.allowList,
        credentials: true,
      })
    );
  } else {
    app.use(cors());
  }
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({
      name: config.metadata.name,
      version: config.metadata.version,
      timestamp: new Date().toISOString(),
    });
  });

  app.all('/api/auth/{*catchAll}', toNodeHandler(auth));

  app.use('/', healthRouter);

  app.use((req, res) => {
    res.status(404).json({
      message: 'Not Found',
      path: req.path,
    });
  });

  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message });
    }
  );

  return app;
};

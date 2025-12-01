import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';

/**
 * Builds and configures the Express application instance.
 */
export const createApp = (): Application => {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((item) => item.trim()).filter(Boolean);
  app.use(
    cors({
      origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : undefined,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({
      name: process.env.APP_NAME ?? 'absent-backend',
      version: process.env.APP_VERSION ?? '0.0.1',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/health', healthRouter);

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

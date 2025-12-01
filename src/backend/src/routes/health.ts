import { Router } from 'express';
import { getMongoStatus } from '../db/mongo';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const mongo = await getMongoStatus();
  const isHealthy = mongo.status === 'ready';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'error',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
    services: {
      mongo,
    },
  });
});

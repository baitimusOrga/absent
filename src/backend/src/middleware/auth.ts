import { Request, Response, NextFunction } from 'express';
import { auth } from '../services/auth';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session) {
      res.status(401).json({
        message: 'Unauthorized',
        error: 'Valid session required',
      });
      return;
    }

    // Attach session and user to request for downstream handlers
    (req as any).session = session.session;
    (req as any).user = session.user;

    next();
  } catch (error) {
    res.status(401).json({
      message: 'Unauthorized',
      error: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
};

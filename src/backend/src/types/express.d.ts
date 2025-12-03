/**
 * Type augmentation for Express Request to include session and user
 */
import { Session, User } from 'better-auth/types';

declare global {
  namespace Express {
    interface Request {
      session?: Session;
      user?: User;
    }
  }
}

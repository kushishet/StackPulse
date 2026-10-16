import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

/**
 * Middleware requiring a valid Bearer token
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: true, message: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    res.status(401).json({ error: true, message: err.message || 'Invalid authentication token.' });
  }
};

/**
 * Middleware that extracts user if Bearer token is provided, but allows unauthenticated requests
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = authService.verifyToken(token);
      req.user = payload;
    } catch (e) {
      // Ignored for optional auth
    }
  }

  next();
};

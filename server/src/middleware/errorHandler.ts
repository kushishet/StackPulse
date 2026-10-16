import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.status || err.statusCode || 500;
  console.error(`[Error] ${req.method} ${req.url} ->`, err.message || err);

  res.status(statusCode).json({
    error: true,
    message: err.message || 'An unexpected internal server error occurred.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.message,
      ...(error.details ? { details: error.details } : {})
    });
  }

  const message = error instanceof Error ? error.message : 'Error interno del servidor';

  return res.status(500).json({
    status: 500,
    message
  });
};

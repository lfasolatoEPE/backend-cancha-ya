import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error:', err);

  const status = err.statusCode || 500;
  const mensaje = err.message || 'Error interno del servidor';

  res.status(status).json({
    error: mensaje
  });
};

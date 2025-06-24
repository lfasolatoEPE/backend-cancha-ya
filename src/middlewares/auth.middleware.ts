import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (token === 'Bearer token123') {
    next();
  } else {
    res.status(401).json({ mensaje: 'No autorizado' });
  }
};

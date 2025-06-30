import { Request, Response, NextFunction } from 'express';

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const usuario = (req as any).usuario;

    if (!usuario || !usuario.rol) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!roles.includes(usuario.rol)) {
      res.status(403).json({ error: 'No tienes permisos para esta operación' });
      return;
    }

    next();
  };
};

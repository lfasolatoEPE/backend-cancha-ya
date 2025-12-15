import { Request, Response, NextFunction } from 'express';
import { NivelAcceso } from '../entities/Rol.entity';

// acepta nombres de rol ("admin", "recepcionista") o niveles ("admin-club", "admin", "usuario")
type RoleOrAccess = string | NivelAcceso;

export const authorizeRoles = (...allowed: RoleOrAccess[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    // Compatibilidad:
    // - user.rol puede ser string (token viejo) o nombre de rol (token nuevo)
    // - user.nivelAcceso es el “scope real” en el nuevo modelo
    const rolNombre = typeof user.rol === 'string' ? user.rol : undefined;
    const nivelAcceso = user.nivelAcceso as NivelAcceso | undefined;

    const ok =
      allowed.includes(rolNombre ?? '') ||
      (nivelAcceso ? allowed.includes(nivelAcceso) : false);

    if (!ok) {
      res.status(403).json({ error: 'No tienes permisos para esta operación' });
      return;
    }

    next();
  };
};

// Si querés un helper “estricto” para nivelAcceso, lo dejás también:
export const authorizeAccess = (...niveles: NivelAcceso[]) => authorizeRoles(...niveles);

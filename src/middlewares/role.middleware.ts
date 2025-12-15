import { Request, Response, NextFunction } from 'express';
import { NivelAcceso } from '../entities/Rol.entity';

// acepta nombres de rol ("admin", "recepcionista") o niveles ("admin-club", "admin", "usuario")
type RoleOrAccess = string | NivelAcceso;

type JwtUser = {
  id: string;
  personaId?: string;
  email?: string;

  // puede venir como string (token viejo o nuevo)
  rol?: string;

  // viene del JWT (derivado de rol.nivelAcceso en el backend al firmar token)
  nivelAcceso?: NivelAcceso;

  // scope para admin-club
  clubIds?: string[];
};

export const authorizeRoles = (...allowed: RoleOrAccess[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as JwtUser | undefined;

    if (!user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const rolNombre = typeof user.rol === 'string' ? user.rol : undefined;
    const nivelAcceso = user.nivelAcceso;

    const ok =
      (rolNombre ? allowed.includes(rolNombre) : false) ||
      (nivelAcceso ? allowed.includes(nivelAcceso) : false);

    if (!ok) {
      res.status(403).json({ error: 'No tienes permisos para esta operación' });
      return;
    }

    next();
  };
};

// helper “estricto” para nivelAcceso:
export const authorizeAccess = (...niveles: NivelAcceso[]) =>
  authorizeRoles(...niveles);

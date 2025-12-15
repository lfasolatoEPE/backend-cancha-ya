import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { NivelAcceso } from '../entities/Rol.entity';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en variables de entorno');
}

type JwtPayload = {
  sub?: string;
  id?: string;
  personaId?: string;
  email?: string;
  rol?: string;               // nombre del rol (informativo)
  nivelAcceso?: NivelAcceso;  // viene de rol.nivelAcceso
  clubIds?: string[];         // scope admin-club
};

export const authMiddleware: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization || req.headers.Authorization;
  const raw = typeof header === 'string' ? header : '';

  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // 🔐 normalización defensiva
    const userId = payload.sub ?? payload.id;
    if (!userId) {
      res.status(401).json({ error: 'Token inválido (sin subject)' });
      return;
    }

    (req as any).user = {
      id: userId,
      personaId: payload.personaId,
      email: payload.email,
      rol: payload.rol, // informativo
      nivelAcceso: payload.nivelAcceso ?? NivelAcceso.Usuario,
      clubIds: Array.isArray(payload.clubIds) ? payload.clubIds : [],
    };

    next();
  } catch (e) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

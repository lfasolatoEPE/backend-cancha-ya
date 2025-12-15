import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en variables de entorno');
}

export const authMiddleware: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization || req.headers.Authorization;
  const raw = typeof header === 'string' ? header : '';

  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;

    (req as any).user = {
      id: payload.sub ?? payload.id,
      personaId: payload.personaId,
      email: payload.email,

      // (informativo)
      rol: payload.rol,

      // ✅ NUEVO (lo que se usa para permisos)
      nivelAcceso: payload.nivelAcceso,

      // admin-club scope
      clubIds: payload.clubIds ?? [],
    };

    next();
  } catch (e) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

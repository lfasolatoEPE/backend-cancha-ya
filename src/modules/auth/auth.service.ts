// src/modules/auth/auth.service.ts
import { AppDataSource } from '../../database/data-source';
import { Usuario } from '../../entities/Usuario.entity';
import { Persona } from '../../entities/Persona.entity';
import { NivelAcceso, Rol } from '../../entities/Rol.entity';
import { RefreshToken } from '../../entities/RefreshToken.entity';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { add } from 'date-fns';
import crypto from 'crypto';
import { isDuplicateError, normEmail } from '../../utils/db';

const usuarioRepo = AppDataSource.getRepository(Usuario);
const personaRepo = AppDataSource.getRepository(Persona);
const rolRepo = AppDataSource.getRepository(Rol);
const refreshRepo = AppDataSource.getRepository(RefreshToken);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en variables de entorno');
}
const ACCESS_TTL_MIN = parseInt(process.env.JWT_ACCESS_MIN || '15', 10);
const REFRESH_TTL_DAYS = parseInt(process.env.JWT_REFRESH_DAYS || '7', 10);

export class AuthService {
  /**
   * Genera el access token JWT.
   * Incluye:
   * - sub        → id de usuario
   * - rol        → 'admin' | 'admin-club' | 'usuario'
   * - personaId  → id de Persona
   * - email      → email de Persona
   * - clubIds    → lista de clubes que administra (puede ser [])
   */
  
  private signAccessToken(user: Usuario) {
    const rolNombre = user.rol?.nombre;
    const nivelAcceso = user.rol?.nivelAcceso as NivelAcceso | undefined;

    const clubIds = Array.isArray(user.adminClubs)
      ? user.adminClubs.map((c) => c.id)
      : [];

    const payload = {
      id: user.id,
      personaId: user.persona.id,
      email: user.persona.email,
      rol: rolNombre,            // "recepcionista", "admin", etc (informativo)
      nivelAcceso,               // "usuario" | "admin-club" | "admin" (lo que manda)
      clubIds,                   // scope para admin-club
    };

    return jwt.sign(payload, JWT_SECRET!, {
      subject: user.id,
      expiresIn: `${ACCESS_TTL_MIN}m`,
    });
  }

  async register(data: { nombre: string; apellido: string; email: string; password: string }) {
    const email = normEmail(data.email);

    try {
      return await AppDataSource.transaction(async (manager) => {
        const personaRepoT = manager.getRepository(Persona);
        const usuarioRepoT = manager.getRepository(Usuario);
        const rolRepoT = manager.getRepository(Rol);
        const refreshRepoT = manager.getRepository(RefreshToken);

        const existente = await personaRepoT.findOne({ where: { email } });
        if (existente) throw new Error('El email ya está registrado');

        const persona = personaRepoT.create({
          nombre: data.nombre,
          apellido: data.apellido,
          email,
        });
        await personaRepoT.save(persona);

        const passwordHash = await bcrypt.hash(data.password, 12);

        const rolUsuario = await rolRepoT.findOne({ where: { nombre: 'usuario' } });
        if (!rolUsuario) {
          throw new Error('Rol base "usuario" no existe. Crear seed de roles.');
        }

        const usuario = usuarioRepoT.create({
          passwordHash,
          persona,
          rol: rolUsuario,
          activo: true,
        });
        await usuarioRepoT.save(usuario);

        const accessToken = this.signAccessToken(usuario);
        const refreshToken = await this.issueRefreshTokenWithManager(usuario, refreshRepoT);

        return { userId: usuario.id, accessToken, refreshToken };
      });
    } catch (err) {
      if (isDuplicateError(err)) {
        throw new Error('El email ya está registrado');
      }
      throw err;
    }
  }

  async login(email: string, password: string) {
    const emailN = normEmail(email);

    const user = await usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.persona', 'p')
      .leftJoinAndSelect('u.rol', 'r')
      .leftJoinAndSelect('u.adminClubs', 'adminClubs')
      .addSelect('u.passwordHash')
      .where('LOWER(p.email) = :email', { email: emailN })
      .getOne();

    if (!user) throw new Error('Credenciales inválidas');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
      await usuarioRepo.save(user);
      throw new Error('Credenciales inválidas');
    }

    if (!user.rol) throw new Error('Usuario sin rol asignado');
    if (!user.rol.nivelAcceso) throw new Error('Rol sin nivelAcceso configurado');

    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    await usuarioRepo.save(user);

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user);

    return { accessToken, refreshToken };
  }

  private async issueRefreshToken(user: Usuario) {
    const token = cryptoRandomString(40);
    const expiresAt = add(new Date(), { days: REFRESH_TTL_DAYS });
    const row = refreshRepo.create({ user, token, expiresAt, revoked: false });
    await refreshRepo.save(row);
    return row.token;
  }

  private async issueRefreshTokenWithManager(
    user: Usuario,
    repo = refreshRepo
  ) {
    const token = cryptoRandomString(40);
    const expiresAt = add(new Date(), { days: REFRESH_TTL_DAYS });
    const row = repo.create({ user, token, expiresAt, revoked: false });
    await repo.save(row);
    return row.token;
  }

  async refresh(refreshToken: string) {
    const row = await refreshRepo
      .createQueryBuilder('rt')
      .leftJoinAndSelect('rt.user', 'u')
      .leftJoinAndSelect('u.persona', 'p')
      .leftJoinAndSelect('u.rol', 'r')
      .leftJoinAndSelect('u.adminClubs', 'adminClubs') // ⬅️ para regenerar clubIds en el nuevo token
      .where('rt.token = :tkn', { tkn: refreshToken })
      .andWhere('rt.revoked = false')
      .getOne();

    if (!row) throw new Error('Refresh token inválido');

    if (row.expiresAt < new Date()) {
      row.revoked = true;
      await refreshRepo.save(row);
      throw new Error('Refresh token expirado');
    }

    const accessToken = this.signAccessToken(row.user);
    return { accessToken };
  }

  async logout(refreshToken: string) {
    const row = await refreshRepo.findOne({ where: { token: refreshToken } });
    if (row) {
      row.revoked = true;
      await refreshRepo.save(row);
    }
    return { ok: true };
  }
}

function cryptoRandomString(length = 40) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

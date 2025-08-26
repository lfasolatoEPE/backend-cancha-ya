import { AppDataSource } from '../../database/data-source';
import { Usuario } from '../../entities/Usuario.entity';
import { Persona } from '../../entities/Persona.entity';
import { Rol } from '../../entities/Rol.entity';
import { RefreshToken } from '../../entities/RefreshToken.entity';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { add } from 'date-fns';

const usuarioRepo = AppDataSource.getRepository(Usuario);
const personaRepo = AppDataSource.getRepository(Persona);
const rolRepo = AppDataSource.getRepository(Rol);
const refreshRepo = AppDataSource.getRepository(RefreshToken);

const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro';
const ACCESS_TTL_MIN = parseInt(process.env.JWT_ACCESS_MIN || '15', 10); // 15m
const REFRESH_TTL_DAYS = parseInt(process.env.JWT_REFRESH_DAYS || '7', 10); // 7d

export class AuthService {
  private signAccessToken(user: Usuario) {
    const payload = {
      id: user.id,
      rol: user.rol.nombre,
      personaId: user.persona.id,
      email: user.persona.email,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: `${ACCESS_TTL_MIN}m` });
  }

  async register(data: { nombre: string; apellido: string; email: string; password: string }) {
    const emailUsado = await personaRepo.findOne({ where: { email: data.email } });
    if (emailUsado) throw new Error('El email ya está registrado');

    const persona = personaRepo.create({ nombre: data.nombre, apellido: data.apellido, email: data.email });
    await personaRepo.save(persona);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const rolUsuario = await rolRepo.findOne({ where: { nombre: 'usuario' } });
    if (!rolUsuario) throw new Error('Rol base "usuario" no existe. Crear seed de roles.');

    const usuario = usuarioRepo.create({ passwordHash, persona, rol: rolUsuario, activo: true });
    await usuarioRepo.save(usuario);

    const accessToken = this.signAccessToken(usuario);
    const refreshToken = await this.issueRefreshToken(usuario);

    return { userId: usuario.id, accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await usuarioRepo.findOne({ where: { persona: { email } } });
    if (!user) throw new Error('Credenciales inválidas');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
      await usuarioRepo.save(user);
      throw new Error('Credenciales inválidas');
    }

    // reset intentos fallidos
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

  async refresh(refreshToken: string) {
    const row = await refreshRepo.findOne({ where: { token: refreshToken, revoked: false } });
    if (!row) throw new Error('Refresh token inválido');

    if (row.expiresAt < new Date()) {
      row.revoked = true;
      await refreshRepo.save(row);
      throw new Error('Refresh token expirado');
    }

    const user = row.user;
    const accessToken = this.signAccessToken(user);
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

// util simple para token opaco
function cryptoRandomString(length = 40) {
  const bytes = Buffer.from(crypto.getRandomValues(new Uint8Array(length)));
  return bytes.toString('hex').slice(0, length);
}

// polyfill para Node < 19 (si hiciera falta)
declare const crypto: any;

import { AppDataSource } from '../../database/data-source';
import { Usuario } from '../../entities/Usuario.entity';
import { Persona } from '../../entities/Persona.entity';
import { Club } from '../../entities/Club.entity';
import { Rol } from '../../entities/Rol.entity';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import bcrypt from 'bcryptjs';
import { isDuplicateError, normEmail } from '../../utils/db';
import { NivelAcceso } from '../../entities/Rol.entity';
import { In } from 'typeorm';

const usuarioRepo = AppDataSource.getRepository(Usuario);
const personaRepo = AppDataSource.getRepository(Persona);
const rolRepo = AppDataSource.getRepository(Rol);
const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
const clubRepo = AppDataSource.getRepository(Club);

export class UsuarioService {
  async crearUsuario(data: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rol?: string;
    clubIds?: string[];
  }) {
    const { nombre, apellido, password, clubIds } = data;
    const email = normEmail(data.email);
    const rolNombre = data.rol ?? 'usuario';

    // Todo-or-nada en transacción
    try {
      const result = await AppDataSource.transaction(async (manager) => {
        const personaRepoT = manager.getRepository(Persona);
        const usuarioRepoT = manager.getRepository(Usuario);
        const rolRepoT = manager.getRepository(Rol);
        const perfilRepoT = manager.getRepository(PerfilCompetitivo);

        const emailUsado = await personaRepoT.findOne({ where: { email } });
        if (emailUsado) throw new Error('El email ya está registrado');

        const persona = personaRepoT.create({ nombre, apellido, email });
        await personaRepoT.save(persona);

        const passwordHash = await bcrypt.hash(password, 12);

        const rolEntity = await rolRepoT.findOne({ where: { nombre: rolNombre } });
        if (!rolEntity) throw new Error('Rol no válido');

        const usuario = usuarioRepoT.create({
          passwordHash,
          persona,
          rol: rolEntity,
          activo: true,
          failedLoginAttempts: 0,
          lastLoginAt: null,
        });
        (usuario as any).adminClubs = [];
        await usuarioRepoT.save(usuario);
        // si es admin-club y vinieron clubIds, asociar clubes
        if (rolNombre === 'admin-club' && clubIds && clubIds.length > 0) {
          const clubs = await manager.getRepository(Club).find({
            where: clubIds.map((id) => ({ id })),
          });

          if (clubs.length !== clubIds.length) {
            throw new Error('Uno o más clubes no existen');
          }

          (usuario as any).adminClubs = clubs;
          await usuarioRepoT.save(usuario);
        }
        // Perfil competitivo inicial (si aplica a tu negocio)
        const perfil = perfilRepoT.create({
          usuario,
          activo: false,
          ranking: 1000,
        });
        await perfilRepoT.save(perfil);

        return {
          id: usuario.id,
          persona: {
            id: persona.id,
            nombre: persona.nombre,
            apellido: persona.apellido,
            email: persona.email,
          },
          rol: rolEntity.nombre,
        };
      });

      return result;
    } catch (err) {
      if (isDuplicateError(err)) {
        throw new Error('El email ya está registrado');
      }
      throw err;
    }
  }

  async crearAdmin(data: { nombre: string; apellido: string; email: string; password: string }) {
    return this.crearUsuario({ ...data, rol: 'admin' });
  }

  async listarUsuarios() {
    const usuarios = await usuarioRepo.find({
      select: {
        id: true,
        activo: true,
        failedLoginAttempts: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      relations: ['persona', 'rol'],
      order: { createdAt: 'DESC' },
    });

    return usuarios.map((u) => ({
      id: u.id,
      activo: u.activo,
      failedLoginAttempts: u.failedLoginAttempts,
      lastLoginAt: u.lastLoginAt,
      persona: {
        id: u.persona.id,
        nombre: u.persona.nombre,
        apellido: u.persona.apellido,
        email: u.persona.email,
      },
      rol: u.rol.nombre,
      adminClubs: u.adminClubs?.map(c => ({ id: c.id, nombre: c.nombre })) ?? [],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }

  async actualizarUsuario(id: string, data: { nombre?: string; apellido?: string; email?: string }) {
    const usuario = await usuarioRepo.findOne({ where: { id }, relations: ['persona'] });
    if (!usuario) throw new Error('Usuario no encontrado');

    if (data.email) usuario.persona.email = normEmail(data.email);
    if (data.nombre) usuario.persona.nombre = data.nombre;
    if (data.apellido) usuario.persona.apellido = data.apellido;

    try {
      await personaRepo.save(usuario.persona);
    } catch (err) {
      if (isDuplicateError(err)) {
        throw new Error('El email ya está registrado');
      }
      throw err;
    }

    return {
      id: usuario.id,
      persona: {
        id: usuario.persona.id,
        nombre: usuario.persona.nombre,
        apellido: usuario.persona.apellido,
        email: usuario.persona.email,
      },
    };
  }

  async cambiarRol(
    userId: string,
    nuevoRol: 'usuario' | 'admin' | 'admin-club',
    clubIds?: string[]
  ) {
    const usuario = await usuarioRepo.findOne({
      where: { id: userId },
      relations: ['rol', 'adminClubs'],
    });
    if (!usuario) throw new Error('Usuario no encontrado');

    const rolEntity = await rolRepo.findOne({ where: { nombre: nuevoRol } });
    if (!rolEntity) throw new Error('Rol no válido');

    usuario.rol = rolEntity;

    // resetear relaciones de adminClubs
    usuario.adminClubs = [];

    if (nuevoRol === 'admin-club' && clubIds && clubIds.length > 0) {
      const clubs = await clubRepo.find({
        where: clubIds.map((id) => ({ id })),
      });

      if (clubs.length !== clubIds.length) {
        throw new Error('Uno o más clubes no existen');
      }

      usuario.adminClubs = clubs;
    }

    await usuarioRepo.save(usuario);

    return {
      id: usuario.id,
      rol: usuario.rol.nombre,
      adminClubs: usuario.adminClubs?.map(c => ({ id: c.id, nombre: c.nombre })) ?? [],
    }
  };

  async actualizarNivelAcceso(opts: {
    targetUserId: string;
    actorUserId: string;
    nivelAcceso: NivelAcceso;
    clubIds?: string[];
  }) {
    const { targetUserId, actorUserId, nivelAcceso, clubIds } = opts;

    // ✅ No permitir que un admin se baje a sí mismo
    if (targetUserId === actorUserId) {
      throw new Error('No puedes cambiar tu propio nivel de acceso');
    }

    const user = await usuarioRepo.findOne({
      where: { id: targetUserId },
      relations: ['persona', 'rol', 'adminClubs'],
    });
    if (!user) throw new Error('Usuario no encontrado');

    // ✅ Validación fuerte para admin-club
    if (nivelAcceso === 'admin-club') {
      if (!clubIds || clubIds.length === 0) {
        throw new Error('Para admin-club debes enviar clubIds');
      }

      const clubs = await clubRepo.find({ where: { id: In(clubIds) } });
      if (clubs.length !== clubIds.length) {
        const missing = clubIds.filter(id => !clubs.find(c => c.id === id));
        throw new Error(`Club(s) no encontrado(s): ${missing.join(', ')}`);
      }

      user.nivelAcceso = nivelAcceso;
      user.adminClubs = clubs;
    } else {
      // usuario o admin => limpiar scope
      user.nivelAcceso = nivelAcceso;
      user.adminClubs = [];
    }

    const saved = await usuarioRepo.save(user);

    return {
      id: saved.id,
      personaId: saved.persona?.id,
      email: saved.persona?.email,
      rol: saved.rol?.nombre,
      nivelAcceso: saved.nivelAcceso,
      clubIds: Array.isArray(saved.adminClubs) ? saved.adminClubs.map(c => c.id) : [],
    };
  }
}

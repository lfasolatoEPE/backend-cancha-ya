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

    try {
      return await AppDataSource.transaction(async (manager) => {
        const personaRepoT = manager.getRepository(Persona);
        const usuarioRepoT = manager.getRepository(Usuario);
        const rolRepoT = manager.getRepository(Rol);
        const perfilRepoT = manager.getRepository(PerfilCompetitivo);
        const clubRepoT = manager.getRepository(Club);

        // 1) Email único
        const emailUsado = await personaRepoT.findOne({ where: { email } });
        if (emailUsado) throw new Error('El email ya está registrado');

        // 2) Rol válido
        const rolEntity = await rolRepoT.findOne({ where: { nombre: rolNombre } });
        if (!rolEntity) throw new Error('Rol no válido');

        // 3) Si el rol hereda AdminClub => clubIds obligatorio
        if (rolEntity.nivelAcceso === NivelAcceso.AdminClub) {
          if (!clubIds || clubIds.length === 0) {
            throw new Error(
              'Para crear un usuario con acceso admin-club debes asignar al menos un club (clubIds).'
            );
          }
        }

        // 4) Crear Persona
        const persona = personaRepoT.create({ nombre, apellido, email });
        await personaRepoT.save(persona);

        // 5) Crear Usuario
        const passwordHash = await bcrypt.hash(password, 12);

        const usuario = usuarioRepoT.create({
          passwordHash,
          persona,
          rol: rolEntity,
          activo: true,
          failedLoginAttempts: 0,
          lastLoginAt: null,
          adminClubs: [],
        });

        // 6) Asignar clubes si corresponde
        if (rolEntity.nivelAcceso === NivelAcceso.AdminClub) {
          const clubs = await clubRepoT.find({ where: { id: In(clubIds!) } });

          if (clubs.length !== clubIds!.length) {
            const missing = clubIds!.filter((id) => !clubs.find((c) => c.id === id));
            throw new Error(`Club(s) no encontrado(s): ${missing.join(', ')}`);
          }

          usuario.adminClubs = clubs;
        } else {
          usuario.adminClubs = [];
        }

        await usuarioRepoT.save(usuario);

        // 7) Perfil competitivo inicial (si aplica)
        const perfil = perfilRepoT.create({
          usuario,
          activo: false,
          ranking: 1000,
        });
        await perfilRepoT.save(perfil);

        // 8) Respuesta
        return {
          id: usuario.id,
          persona: {
            id: persona.id,
            nombre: persona.nombre,
            apellido: persona.apellido,
            email: persona.email,
          },
          rol: rolEntity.nombre,
          nivelAcceso: rolEntity.nivelAcceso,
          adminClubs: (usuario.adminClubs ?? []).map((c) => ({ id: c.id, nombre: c.nombre })),
          clubIds: (usuario.adminClubs ?? []).map((c) => c.id),
        };
      });
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
    nuevoRol: string, // 👈 ahora es cualquier nombre de rol válido en BD
    clubIds?: string[]
  ) {
    const usuario = await usuarioRepo.findOne({
      where: { id: userId },
      relations: ['rol', 'adminClubs', 'persona'],
    });
    if (!usuario) throw new Error('Usuario no encontrado');

    const rolEntity = await rolRepo.findOne({ where: { nombre: nuevoRol } });
    if (!rolEntity) throw new Error('Rol no válido');

    // ✅ Regla: si el rol hereda AdminClub => clubes obligatorios
    if (rolEntity.nivelAcceso === NivelAcceso.AdminClub) {
      if (!clubIds || clubIds.length === 0) {
        throw new Error('Para asignar un rol con acceso admin-club debes enviar clubIds (al menos 1 club).');
      }

      const clubs = await clubRepo.find({ where: { id: In(clubIds) } });

      if (clubs.length !== clubIds.length) {
        const missing = clubIds.filter((id) => !clubs.find((c) => c.id === id));
        throw new Error(`Club(s) no encontrado(s): ${missing.join(', ')}`);
      }

      usuario.adminClubs = clubs;
    } else {
      // cualquier otro nivel => sin scope
      usuario.adminClubs = [];
    }

    usuario.rol = rolEntity;

    // ✅ Si todavía existe usuario.nivelAcceso como columna, sincronizalo
    // (si lo eliminás del entity, borrá esta línea)
    (usuario as any).nivelAcceso = rolEntity.nivelAcceso;

    const saved = await usuarioRepo.save(usuario);

    return {
      id: saved.id,
      email: saved.persona?.email,
      rol: saved.rol.nombre,
      nivelAcceso: saved.rol.nivelAcceso, // 👈 viene del rol
      adminClubs: (saved.adminClubs ?? []).map((c) => ({ id: c.id, nombre: c.nombre })),
      clubIds: (saved.adminClubs ?? []).map((c) => c.id),
    };
  }
}

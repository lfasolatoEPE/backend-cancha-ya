import { AppDataSource } from '../../database/data-source';
import { Usuario } from '../../entities/Usuario.entity';
import { Persona } from '../../entities/Persona.entity';
import { Rol } from '../../entities/Rol.entity';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import bcrypt from 'bcryptjs';
import { isDuplicateError, normEmail } from '../../utils/db';

const usuarioRepo = AppDataSource.getRepository(Usuario);
const personaRepo = AppDataSource.getRepository(Persona);
const rolRepo = AppDataSource.getRepository(Rol);
const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);

export class UsuarioService {
  async crearUsuario(data: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    rol?: string;
  }) {
    const { nombre, apellido, password } = data;
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
        await usuarioRepoT.save(usuario);

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

  async cambiarRol(userId: string, nuevoRol: 'usuario' | 'admin') {
    const usuario = await usuarioRepo.findOne({ where: { id: userId }, relations: ['rol'] });
    if (!usuario) throw new Error('Usuario no encontrado');

    const rolEntity = await rolRepo.findOne({ where: { nombre: nuevoRol } });
    if (!rolEntity) throw new Error('Rol no válido');

    usuario.rol = rolEntity;
    await usuarioRepo.save(usuario);

    return { id: usuario.id, rol: usuario.rol.nombre };
  }
}

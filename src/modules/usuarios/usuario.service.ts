import { AppDataSource } from '../../database/data-source';
import { Usuario } from '../../entities/Usuario.entity';
import { Persona } from '../../entities/Persona.entity';
import { Rol } from '../../entities/Rol.entity';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import bcrypt from 'bcryptjs';

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
    const { nombre, apellido, email, password, rol = 'usuario' } = data;

    const emailUsado = await personaRepo.findOne({ where: { email } });
    if (emailUsado) throw new Error('El email ya está registrado');

    const persona = personaRepo.create({ nombre, apellido, email });
    await personaRepo.save(persona);

    const passwordHash = await bcrypt.hash(password, 12);

    const rolEntity = await rolRepo.findOne({ where: { nombre: rol } });
    if (!rolEntity) throw new Error('Rol no válido');

    const usuario = usuarioRepo.create({
      passwordHash,
      persona,
      rol: rolEntity,
      activo: true,
      failedLoginAttempts: 0,
      lastLoginAt: null,
    });

    await usuarioRepo.save(usuario);

    // Perfil competitivo inicial (si aplica a tu negocio)
    const perfil = perfilRepo.create({
      usuario,
      activo: false,
      ranking: 1000,
    });
    await perfilRepo.save(perfil);

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
      },
      relations: ['persona', 'rol'],
    });

    return usuarios.map((u) => ({
      id: u.id,
      activo: u.activo,
      failedLoginAttempts: u.failedLoginAttempts,
      lastLoginAt: u.lastLoginAt,
      persona: { id: u.persona.id, nombre: u.persona.nombre, apellido: u.persona.apellido, email: u.persona.email },
      rol: u.rol.nombre,
    }));
  }

  async actualizarUsuario(id: string, data: { nombre?: string; apellido?: string; email?: string }) {
    const usuario = await usuarioRepo.findOne({ where: { id }, relations: ['persona'] });
    if (!usuario) throw new Error('Usuario no encontrado');

    if (data.email) usuario.persona.email = data.email;
    if (data.nombre) usuario.persona.nombre = data.nombre;
    if (data.apellido) usuario.persona.apellido = data.apellido;

    await personaRepo.save(usuario.persona);

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

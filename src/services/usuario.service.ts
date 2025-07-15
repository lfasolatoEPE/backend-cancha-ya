import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario.entity';
import bcrypt from 'bcryptjs';

const usuarioRepository = AppDataSource.getRepository(Usuario);

export const crearUsuario = async (data: { nombre: string; email: string; password: string }) => {
  //{
  //   "nombre": "Usuario",
  //   "email": "usuario@cancha.com",
  //   "password": "123456",
  //   "rol": "usuario"
  // }
  if (!data.nombre || !data.email || !data.password) {
    throw new Error('Datos incompletos');
  }

  const yaExiste = await usuarioRepository.findOneBy({ email: data.email });
  if (yaExiste) {
    throw new Error('El email ya está registrado');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const nuevoUsuario = usuarioRepository.create({
    nombre: data.nombre,
    email: data.email,
    passwordHash,
    rol: 'usuario',
  });

  await usuarioRepository.save(nuevoUsuario);

  const { passwordHash: _, ...usuarioSinPassword } = nuevoUsuario;
  return usuarioSinPassword;
};

export const crearAdmin = async (data: { nombre: string; email: string; password: string }) => {
  //{
  //   "nombre": "Admin",
  //   "email": "admin@cancha.com",
  //   "password": "123456",
  //   "rol": "admin"
  // }
  if (!data.nombre || !data.email || !data.password) {
    throw new Error('Datos incompletos');
  }

  const yaExiste = await usuarioRepository.findOneBy({ email: data.email });
  if (yaExiste) {
    throw new Error('El email ya está registrado');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const nuevoUsuario = usuarioRepository.create({
    nombre: data.nombre,
    email: data.email,
    passwordHash,
    rol: 'admin',
  });

  await usuarioRepository.save(nuevoUsuario);

  const { passwordHash: _, ...usuarioSinPassword } = nuevoUsuario;
  return usuarioSinPassword;
};

export const listarUsuarios = async () => {
  const usuarios = await usuarioRepository.find({
    select: ['id', 'nombre', 'email', 'rol', 'activo'], // nunca devuelvas el hash
  });
  return usuarios;
};

export const actualizarUsuario = async (
  id: string,
  data: { email?: string; nombre?: string }
) => {
  const usuario = await usuarioRepository.findOneBy({ id });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  if (data.email) {
    usuario.email = data.email;
  }

  if (data.nombre) {
    usuario.nombre = data.nombre;
  }

  await usuarioRepository.save(usuario);

  const { passwordHash: _, ...usuarioSinPassword } = usuario;
  return usuarioSinPassword;
};
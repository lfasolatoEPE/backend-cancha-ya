import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario.entity';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const usuarioRepository = AppDataSource.getRepository(Usuario);

export const loginUsuario = async (email: string, password: string) => {
  const usuario = await usuarioRepository.findOneBy({ email });
  if (!usuario) {
    throw new Error('Credenciales inválidas');
  }

  const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordOk) {
    throw new Error('Credenciales inválidas');
  }

  // Crear token
  const token = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    },
    process.env.JWT_SECRET || 'mi_secreto_super_seguro',
    { expiresIn: '8h' }
  );

  return { token };
};

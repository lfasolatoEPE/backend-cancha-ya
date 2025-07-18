import { AppDataSource } from '../../database/data-source';
import { Usuario } from '../../entities/Usuario.entity';
import { Persona } from '../../entities/Persona.entity';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';

const usuarioRepo = AppDataSource.getRepository(Usuario);
const personaRepo = AppDataSource.getRepository(Persona);

export class AuthService {
  async loginUsuario(dto: LoginDto): Promise<string> {
    const { email, password } = dto;

    // Buscar persona por email
    const persona = await personaRepo.findOne({ where: { email } });
    if (!persona) throw new Error('Credenciales inválidas');

    // Buscar usuario por persona
    const usuario = await usuarioRepo.findOne({
      where: { persona: { id: persona.id } },
      relations: ['persona', 'rol']
    });

    if (!usuario) throw new Error('Credenciales inválidas');

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) throw new Error('Credenciales inválidas');

    // Crear token
    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol.nombre,
        personaId: usuario.persona.id
      },
      process.env.JWT_SECRET || 'mi_secreto_super_seguro',
      { expiresIn: '2h' }
    );

    return token;
  }
}

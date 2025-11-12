import { AppDataSource } from '../../database/data-source';
import { Persona } from '../../entities/Persona.entity';
import { isDuplicateError, normEmail } from '../../utils/db';

const repo = AppDataSource.getRepository(Persona);

export class PersonaService {
  async listar() {
    return await repo.find({ order: { apellido: 'ASC' } });
  }

  async obtenerPorId(id: string) {
    const persona = await repo.findOneBy({ id });
    if (!persona) throw new Error('Persona no encontrada');
    return persona;
  }

  async actualizar(id: string, data: { nombre?: string; apellido?: string; email?: string; avatarUrl?: string }) {
    const persona = await repo.findOneBy({ id });
    if (!persona) throw new Error('Persona no encontrada');

    if (data.nombre !== undefined) persona.nombre = data.nombre;
    if (data.apellido !== undefined) persona.apellido = data.apellido;
    if (data.email !== undefined) persona.email = normEmail(data.email);
    if (data.avatarUrl !== undefined) persona.avatarUrl = data.avatarUrl;

    try {
      return await repo.save(persona);
    } catch (err) {
      if (isDuplicateError(err)) throw new Error('El email ya está registrado');
      throw err;
    }
  }

  async eliminar(id: string) {
    const persona = await this.obtenerPorId(id);
    await repo.remove(persona);
  }
}

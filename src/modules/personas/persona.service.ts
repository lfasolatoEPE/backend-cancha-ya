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

  async actualizar(id: string, data: { nombre?: string; apellido?: string; email?: string }) {
    const persona = await repo.findOneBy({ id });
    if (!persona) throw new Error('Persona no encontrada');

    if (data.nombre !== undefined) persona.nombre = data.nombre?.trim() || persona.nombre;
    if (data.apellido !== undefined) persona.apellido = data.apellido?.trim() || persona.apellido;

    if (data.email !== undefined) {
      const normalized = normEmail(data.email);
      if (!normalized) throw new Error('Email inválido');
      if (normalized !== persona.email) {
        const dup = await repo.findOne({ where: { email: normalized } });
        if (dup && dup.id !== persona.id) throw new Error('El email ya está registrado');
        persona.email = normalized;
      }
    }

    try {
      return await repo.save(persona);
    } catch (err) {
      if (isDuplicateError(err)) {
        throw new Error('El email ya está registrado');
      }
      throw err;
    }
  }

  async eliminar(id: string) {
    const persona = await this.obtenerPorId(id);
    await repo.remove(persona);
  }
}

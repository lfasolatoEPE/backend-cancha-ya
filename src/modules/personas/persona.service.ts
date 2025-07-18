import { AppDataSource } from '../../database/data-source';
import { Persona } from '../../entities/Persona.entity';

const repo = AppDataSource.getRepository(Persona);

export class PersonaService {
  async listar() {
    return await repo.find();
  }

  async obtenerPorId(id: string) {
    const persona = await repo.findOneBy({ id });
    if (!persona) throw new Error('Persona no encontrada');
    return persona;
  }

  async actualizar(id: string, data: { nombre?: string; apellido?: string; email?: string }) {
    const persona = await repo.findOneBy({ id });
    if (!persona) throw new Error('Persona no encontrada');

    if (data.nombre) persona.nombre = data.nombre;
    if (data.apellido) persona.apellido = data.apellido;
    if (data.email) persona.email = data.email;

    return await repo.save(persona);
  }

  async eliminar(id: string) {
    const persona = await this.obtenerPorId(id);
    await repo.remove(persona);
  }
}

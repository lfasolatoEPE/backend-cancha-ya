import { AppDataSource } from '../../database/data-source';
import { Deporte } from '../../entities/Deporte.entity';

const repo = AppDataSource.getRepository(Deporte);

export class DeporteService {
  async crear(data: { nombre: string }) {
    const existente = await repo.findOneBy({ nombre: data.nombre });
    if (existente) throw new Error('El deporte ya existe');

    const nuevo = repo.create({ nombre: data.nombre });
    return await repo.save(nuevo);
  }

  async listar() {
    return await repo.find({ order: { nombre: 'ASC' } });
  }
}

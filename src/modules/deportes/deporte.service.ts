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

  async actualizar(id: string, data: Partial<{ nombre: string }>) {
    const deporte = await repo.findOneBy({ id });
    if (!deporte) throw new Error('Deporte no encontrado');

    if (data.nombre && data.nombre !== deporte.nombre) {
      const dup = await repo.findOne({ where: { nombre: data.nombre } });
      if (dup && dup.id !== deporte.id) {
        throw new Error('El deporte ya existe');
      }
      deporte.nombre = data.nombre;
    }

    return await repo.save(deporte);
  }

  async listar() {
    return await repo.find({ order: { nombre: 'ASC' } });
  }

  // opcional: si agregás GET /:id
  // async obtenerPorId(id: string) {
  //   const deporte = await repo.findOneBy({ id });
  //   if (!deporte) throw new Error('Deporte no encontrado');
  //   return deporte;
  // }
}

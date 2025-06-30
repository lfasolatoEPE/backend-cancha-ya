import { AppDataSource } from '../database/data-source';
import { Deporte } from '../entities/Deporte.entity';

const repo = AppDataSource.getRepository(Deporte);

export const crearDeporte = async (data: { nombre: string }) => {
  const existe = await repo.findOneBy({ nombre: data.nombre });
  if (existe) throw new Error('El deporte ya existe');

  const deporte = repo.create(data);
  return await repo.save(deporte);
};

export const listarDeportes = async () => {
  return await repo.find();
};

export const obtenerDeportePorId = async (id: string) => {
  const deporte = await repo.findOneBy({ id });
  if (!deporte) throw new Error('Deporte no encontrado');
  return deporte;
};

export const actualizarDeporte = async (id: string, data: any) => {
  const deporte = await obtenerDeportePorId(id);
  repo.merge(deporte, data);
  return await repo.save(deporte);
};

export const eliminarDeporte = async (id: string) => {
  const deporte = await obtenerDeportePorId(id);
  return await repo.remove(deporte);
};

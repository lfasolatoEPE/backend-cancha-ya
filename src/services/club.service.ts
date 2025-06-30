import { AppDataSource } from '../database/data-source';
import { Club } from '../entities/Club.entity';

const repo = AppDataSource.getRepository(Club);

export const crearClub = async (data: any) => {
  const club = repo.create(data);
  return await repo.save(club);
};

export const listarClubes = async () => {
  return await repo.find({ relations: ['canchas'] });
};

export const obtenerClubPorId = async (id: string) => {
  const club = await repo.findOne({ where: { id }, relations: ['canchas'] });
  if (!club) throw new Error('Club no encontrado');
  return club;
};

export const actualizarClub = async (id: string, data: any) => {
  const club = await obtenerClubPorId(id);
  repo.merge(club, data);
  return await repo.save(club);
};

export const eliminarClub = async (id: string) => {
  const club = await obtenerClubPorId(id);
  return await repo.remove(club);
};

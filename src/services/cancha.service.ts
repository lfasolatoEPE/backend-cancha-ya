import { AppDataSource } from '../database/data-source';
import { Cancha } from '../entities/Cancha.entity';
import { Deporte } from '../entities/Deporte.entity';
import { Club } from '../entities/Club.entity';

const canchaRepo = AppDataSource.getRepository(Cancha);
const deporteRepo = AppDataSource.getRepository(Deporte);
const clubRepo = AppDataSource.getRepository(Club);

export const crearCancha = async (data: any) => {
  let deporte = undefined;
  if (data.deporteId) {
    deporte = await deporteRepo.findOneBy({ id: data.deporteId });
    if (!deporte) throw new Error('Deporte no encontrado');
  }

  let club = undefined;
  if (data.clubId) {
    club = await clubRepo.findOneBy({ id: data.clubId });
    if (!club) throw new Error('Club no encontrado');
  }

  const canchaData: any = {
    nombre: data.nombre,
    ubicacion: data.ubicacion,
    tipoSuperficie: data.tipoSuperficie,
    precioPorHora: data.precioPorHora
  };

  if (deporte) canchaData.deporte = deporte;
  if (club) canchaData.club = club;

  const cancha = canchaRepo.create(canchaData);
  return await canchaRepo.save(cancha);
};

export const listarCanchas = async () => {
  return await canchaRepo.find({ relations: ['deporte', 'club'] });
};

export const obtenerCanchaPorId = async (id: string) => {
  const cancha = await canchaRepo.findOne({ where: { id }, relations: ['deporte', 'club'] });
  if (!cancha) throw new Error('Cancha no encontrada');
  return cancha;
};

export const actualizarCancha = async (id: string, data: any) => {
  const cancha = await obtenerCanchaPorId(id);

  if (data.deporteId) {
    const deporte = await deporteRepo.findOneBy({ id: data.deporteId });
    if (!deporte) throw new Error('Deporte no encontrado');
    cancha.deporte = deporte;
  }

  if (data.clubId) {
    const club = await clubRepo.findOneBy({ id: data.clubId });
    if (!club) throw new Error('Club no encontrado');
    cancha.club = club;
  }

  canchaRepo.merge(cancha, data);
  return await canchaRepo.save(cancha);
};

export const eliminarCancha = async (id: string) => {
  const cancha = await obtenerCanchaPorId(id);
  return await canchaRepo.remove(cancha);
};

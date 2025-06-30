import { AppDataSource } from '../database/data-source';
import { Horario } from '../entities/Horario.entity';
import { Cancha } from '../entities/Cancha.entity';

const horarioRepo = AppDataSource.getRepository(Horario);
const canchaRepo = AppDataSource.getRepository(Cancha);

export const crearHorario = async (data: any) => {
  const cancha = await canchaRepo.findOneBy({ id: data.canchaId });
  if (!cancha) throw new Error('Cancha no encontrada');

  const horario = horarioRepo.create({
    dia: data.dia,
    horaInicio: data.horaInicio,
    horaFin: data.horaFin,
    cancha
  });

  return await horarioRepo.save(horario);
};

export const listarHorarios = async () => {
  return await horarioRepo.find({ relations: ['cancha'] });
};

export const obtenerHorarioPorId = async (id: string) => {
  const horario = await horarioRepo.findOne({ where: { id }, relations: ['cancha'] });
  if (!horario) throw new Error('Horario no encontrado');
  return horario;
};

export const actualizarHorario = async (id: string, data: any) => {
  const horario = await obtenerHorarioPorId(id);
  horarioRepo.merge(horario, data);
  return await horarioRepo.save(horario);
};

export const eliminarHorario = async (id: string) => {
  const horario = await obtenerHorarioPorId(id);
  return await horarioRepo.remove(horario);
};

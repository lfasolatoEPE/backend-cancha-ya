import { AppDataSource } from '../database/data-source';
import { Valoracion } from '../entities/Valoracion.entity';
import { Usuario } from '../entities/Usuario.entity';
import { Cancha } from '../entities/Cancha.entity';

const repo = AppDataSource.getRepository(Valoracion);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const canchaRepo = AppDataSource.getRepository(Cancha);

export const crearValoracion = async (data: any) => {
  const usuario = await usuarioRepo.findOneBy({ id: data.usuarioId });
  if (!usuario) throw new Error('Usuario no encontrado');

  const cancha = await canchaRepo.findOneBy({ id: data.canchaId });
  if (!cancha) throw new Error('Cancha no encontrada');

  const valoracion = repo.create({
    puntaje: data.puntaje,
    comentario: data.comentario,
    usuario,
    cancha
  });

  return await repo.save(valoracion);
};

export const listarValoraciones = async () => {
  return await repo.find({ relations: ['usuario', 'cancha'] });
};

export const obtenerValoracionPorId = async (id: string) => {
  const valoracion = await repo.findOne({ where: { id }, relations: ['usuario', 'cancha'] });
  if (!valoracion) throw new Error('Valoración no encontrada');
  return valoracion;
};

export const eliminarValoracion = async (id: string) => {
  const valoracion = await obtenerValoracionPorId(id);
  return await repo.remove(valoracion);
};

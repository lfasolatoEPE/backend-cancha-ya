import { AppDataSource } from '../database/data-source';
import { Deuda } from '../entities/Deuda.entity';
import { Usuario } from '../entities/Usuario.entity';

const deudaRepo = AppDataSource.getRepository(Deuda);
const usuarioRepo = AppDataSource.getRepository(Usuario);

export const crearDeuda = async (data: any) => {
  const usuario = await usuarioRepo.findOneBy({ id: data.usuarioId });
  if (!usuario) throw new Error('Usuario no encontrado');

  const deuda = deudaRepo.create({
    monto: data.monto,
    fechaVencimiento: data.fechaVencimiento,
    usuario
  });

  return await deudaRepo.save(deuda);
};

export const listarDeudas = async () => {
  return await deudaRepo.find({ relations: ['usuario'] });
};

export const obtenerDeudaPorId = async (id: string) => {
  const deuda = await deudaRepo.findOne({ where: { id }, relations: ['usuario'] });
  if (!deuda) throw new Error('Deuda no encontrada');
  return deuda;
};

export const actualizarDeuda = async (id: string, data: any) => {
  const deuda = await obtenerDeudaPorId(id);
  deudaRepo.merge(deuda, data);
  return await deudaRepo.save(deuda);
};

export const eliminarDeuda = async (id: string) => {
  const deuda = await obtenerDeudaPorId(id);
  return await deudaRepo.remove(deuda);
};

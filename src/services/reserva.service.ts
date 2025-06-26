import { AppDataSource } from '../database/data-source';
import { Reserva } from '../entities/Reserva.entity';
import { Usuario } from '../entities/Usuario.entity';
import { Cancha } from '../entities/Cancha.entity';

interface CrearReservaDto {
  usuarioId: string;
  canchaId: string;
  fecha: string;
  hora: string;
}

const reservaRepo = AppDataSource.getRepository(Reserva);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const canchaRepo = AppDataSource.getRepository(Cancha);

export const crearReserva = async (dto: CrearReservaDto) => {
  const { usuarioId, canchaId, fecha, hora } = dto;

  const usuario = await usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['reservas'] });
  if (!usuario) throw new Error('Usuario no encontrado');

  const cancha = await canchaRepo.findOne({ where: { id: canchaId }, relations: ['reservas'] });
  if (!cancha) throw new Error('Cancha no encontrada');

  // Simulación: lógica de deuda
  const tieneDeuda = false; // Acá iría tu lógica real
  if (tieneDeuda) throw new Error('El usuario tiene deuda');

  const yaExiste = await reservaRepo.findOne({
    where: {
      cancha: { id: canchaId },
      fecha,
      hora
    }
  });
  if (yaExiste) throw new Error('Ya existe una reserva para esa cancha, fecha y hora');

  const nueva = reservaRepo.create({
    fecha,
    hora,
    creadaEl: new Date(),
    confirmada: false,
    usuario,
    cancha
  });

  return await reservaRepo.save(nueva);
};

export const confirmarReserva = async (id: string) => {
  const reserva = await reservaRepo.findOne({ where: { id }, relations: ['usuario', 'cancha'] });
  if (!reserva) throw new Error('Reserva no encontrada');

  reserva.confirmada = true;
  return await reservaRepo.save(reserva);
};

export const cancelarReserva = async (id: string) => {
  const reserva = await reservaRepo.findOneBy({ id });
  if (!reserva) throw new Error('Reserva no encontrada');

  await reservaRepo.remove(reserva);
  return { mensaje: 'Reserva cancelada' };
};

export const obtenerTodas = async () => {
  return await reservaRepo.find({ relations: ['usuario', 'cancha'] });
};

export const obtenerPorId = async (id: string) => {
  const reserva = await reservaRepo.findOne({ where: { id }, relations: ['usuario', 'cancha'] });
  if (!reserva) throw new Error('Reserva no encontrada');
  return reserva;
};

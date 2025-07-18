import { AppDataSource } from '../../database/data-source';
import { Reserva, EstadoReserva } from '../../entities/Reserva.entity';
import { Persona } from '../../entities/Persona.entity';
import { Cancha } from '../../entities/Cancha.entity';
import { Deuda } from '../../entities/Deuda.entity';
import { Horario } from '../../entities/Horario.entity';

const reservaRepo = AppDataSource.getRepository(Reserva);
const personaRepo = AppDataSource.getRepository(Persona);
const canchaRepo = AppDataSource.getRepository(Cancha);
const deudaRepo = AppDataSource.getRepository(Deuda);
const horarioRepo = AppDataSource.getRepository(Horario);

export class ReservaService {
  async crearReserva(dto: {
    personaId: string;
    canchaId: string;
    horarioId: string;
    fechaHora: string;
  }) {
    const { personaId, canchaId, horarioId, fechaHora } = dto;

    const persona = await personaRepo.findOne({ where: { id: personaId } });
    if (!persona) throw new Error('Persona no encontrada');

    const cancha = await canchaRepo.findOne({ where: { id: canchaId } });
    if (!cancha) throw new Error('Cancha no encontrada');

    const horario = await horarioRepo.findOne({ where: { id: horarioId } });
    if (!horario) throw new Error('Horario no encontrado');

    const deudasImpagas = await deudaRepo.find({
      where: { persona: { id: personaId }, pagada: false }
    });

    if (deudasImpagas.length > 0) {
      const total = deudasImpagas.reduce((sum, d) => sum + Number(d.monto), 0);
      throw new Error(`La persona tiene ${deudasImpagas.length} deuda(s) pendiente(s) por un total de $${total.toFixed(2)}`);
    }

    const yaExiste = await reservaRepo.findOne({
      where: { cancha: { id: canchaId }, fechaHora: new Date(fechaHora) }
    });
    if (yaExiste) throw new Error('Ya existe una reserva para esa cancha, fecha y hora');

    const reserva = reservaRepo.create({
      fechaHora: new Date(fechaHora),
      creadaEl: new Date(),
      estado: EstadoReserva.Pendiente,
      persona,
      cancha,
      horario
    });

    return await reservaRepo.save(reserva);
  }

  async confirmarReserva(id: string) {
    const reserva = await reservaRepo.findOne({ where: { id } });
    if (!reserva) throw new Error('Reserva no encontrada');

    reserva.estado = EstadoReserva.Confirmada;
    return await reservaRepo.save(reserva);
  }

  async cancelarReserva(id: string) {
    const reserva = await reservaRepo.findOne({ where: { id } });
    if (!reserva) throw new Error('Reserva no encontrada');

    reserva.estado = EstadoReserva.Cancelada;
    return await reservaRepo.save(reserva);
  }

  async obtenerTodas() {
    return await reservaRepo.find({ relations: ['persona', 'cancha', 'horario'] });
  }

  async obtenerPorId(id: string) {
    const reserva = await reservaRepo.findOne({
      where: { id },
      relations: ['persona', 'cancha', 'horario']
    });
    if (!reserva) throw new Error('Reserva no encontrada');
    return reserva;
  }
}

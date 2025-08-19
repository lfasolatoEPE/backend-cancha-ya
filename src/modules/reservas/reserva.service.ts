import { AppDataSource } from '../../database/data-source';
import { Reserva, EstadoReserva } from '../../entities/Reserva.entity';
import { Persona } from '../../entities/Persona.entity';
import { Deuda } from '../../entities/Deuda.entity';
import { DisponibilidadHorario } from '../../entities/DisponibilidadHorario.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';

const reservaRepo = AppDataSource.getRepository(Reserva);
const personaRepo = AppDataSource.getRepository(Persona);
const deudaRepo = AppDataSource.getRepository(Deuda);
const disponibilidadRepo = AppDataSource.getRepository(DisponibilidadHorario);
const auditoriaService = new AuditoriaService();

export class ReservaService {
  async crearReserva(dto: {
    personaId: string;
    disponibilidadId: string;
    fechaHora: string;
    usuarioId: string;
  }) {
    const { personaId, disponibilidadId, fechaHora, usuarioId } = dto;

    const persona = await personaRepo.findOne({ where: { id: personaId } });
    if (!persona) throw new Error('Persona no encontrada');

    const disponibilidad = await disponibilidadRepo.findOne({
      where: { id: disponibilidadId },
      relations: ['cancha', 'horario']
    });
    if (!disponibilidad) throw new Error('Disponibilidad no encontrada');
    if (!disponibilidad.disponible) throw new Error('El horario está marcado como no disponible');

    const fecha = new Date(fechaHora);
    const diaSemana = fecha.getDay();
    if (disponibilidad.diaSemana !== diaSemana) {
      throw new Error('La disponibilidad no corresponde al día de la semana de la fecha seleccionada');
    }

    const deudasImpagas = await deudaRepo.find({
      where: { persona: { id: personaId }, pagada: false }
    });
    if (deudasImpagas.length > 0) {
      const total = deudasImpagas.reduce((sum, d) => sum + Number(d.monto), 0);
      throw new Error(`La persona tiene ${deudasImpagas.length} deuda(s) pendiente(s) por un total de $${total.toFixed(2)}`);
    }

    const yaExiste = await reservaRepo.findOne({
      where: {
        disponibilidad: { id: disponibilidadId },
        fechaHora: fecha
      }
    });
    if (yaExiste) throw new Error('Ya existe una reserva para esa cancha, fecha y horario');

    const reserva = reservaRepo.create({
      fechaHora: fecha,
      creadaEl: new Date(),
      estado: EstadoReserva.Pendiente,
      persona,
      disponibilidad
    });

    const creada = await reservaRepo.save(reserva);

    await auditoriaService.registrar({
      usuarioId,
      accion: 'crear_reserva',
      descripcion: `Persona ${persona.nombre} ${persona.apellido} creó una reserva en cancha ${disponibilidad.cancha.nombre}`,
      entidad: 'reserva',
      entidadId: creada.id
    });

    return creada;
  }

  async confirmarReserva(id: string, usuarioId: string) {
    const reserva = await reservaRepo.findOne({
      where: { id },
      relations: ['persona', 'disponibilidad', 'disponibilidad.cancha']
    });

    if (!reserva) throw new Error('Reserva no encontrada');

    reserva.estado = EstadoReserva.Confirmada;
    const actualizada = await reservaRepo.save(reserva);

    await auditoriaService.registrar({
      usuarioId,
      accion: 'confirmar_reserva',
      descripcion: `Reserva confirmada por ${reserva.persona.nombre} ${reserva.persona.apellido} en cancha ${reserva.disponibilidad.cancha.nombre}`,
      entidad: 'reserva',
      entidadId: actualizada.id
    });

    return actualizada;
  }

  async cancelarReserva(id: string, usuarioId: string) {
    const reserva = await reservaRepo.findOne({
      where: { id },
      relations: ['persona', 'disponibilidad', 'disponibilidad.cancha']
    });

    if (!reserva) throw new Error('Reserva no encontrada');

    reserva.estado = EstadoReserva.Cancelada;
    const actualizada = await reservaRepo.save(reserva);

    await auditoriaService.registrar({
      usuarioId,
      accion: 'cancelar_reserva',
      descripcion: `Reserva cancelada por ${reserva.persona.nombre} ${reserva.persona.apellido} en cancha ${reserva.disponibilidad.cancha.nombre}`,
      entidad: 'reserva',
      entidadId: actualizada.id
    });

    return actualizada;
  }

  async obtenerTodas() {
    return await reservaRepo.find({
      relations: ['persona', 'disponibilidad', 'disponibilidad.cancha', 'disponibilidad.horario']
    });
  }

  async obtenerPorId(id: string) {
    const reserva = await reservaRepo.findOne({
      where: { id },
      relations: ['persona', 'disponibilidad', 'disponibilidad.cancha', 'disponibilidad.horario']
    });
    if (!reserva) throw new Error('Reserva no encontrada');
    return reserva;
  }
}

import { AppDataSource } from '../../database/data-source';
import { Reserva, EstadoReserva } from '../../entities/Reserva.entity';
import { Persona } from '../../entities/Persona.entity';
import { Deuda } from '../../entities/Deuda.entity';
import { DisponibilidadHorario } from '../../entities/DisponibilidadHorario.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { DateTime } from 'luxon';
import { Usuario } from '../../entities/Usuario.entity';
import { crearStateParaReserva } from './state/reserva-state.factory';

const auditoriaService = new AuditoriaService();

export class ReservaService {
  async crearReserva(dto: {
    personaId: string;
    disponibilidadId: string;
    fechaHora: string; // ISO
    usuarioId: string;
  }) {
    const { personaId, disponibilidadId, fechaHora, usuarioId } = dto;

    return await AppDataSource.transaction(async (manager) => {
      const reservaRepo = manager.getRepository(Reserva);
      const personaRepo = manager.getRepository(Persona);
      const deudaRepo = manager.getRepository(Deuda);
      const disponibilidadRepo = manager.getRepository(DisponibilidadHorario);

      const persona = await personaRepo.findOne({ where: { id: personaId } });
      if (!persona) throw new Error('Persona no encontrada');

      const disponibilidad = await disponibilidadRepo.findOne({
        where: { id: disponibilidadId },
        relations: ['cancha', 'horario'],
      });
      if (!disponibilidad) throw new Error('Disponibilidad no encontrada');
      if (!disponibilidad.disponible) {
        throw new Error('El horario está marcado como no disponible');
      }

      // Parseo horario con tz local AR (ajustá si querés UTC)
      const fecha = DateTime.fromISO(fechaHora, {
        zone: 'America/Argentina/Cordoba',
      });
      if (!fecha.isValid) throw new Error('fechaHora inválida');

      const diaSemana = fecha.weekday % 7; // Luxon: 1=lun..7=dom → %7 hace dom=0
      if (disponibilidad.diaSemana !== diaSemana) {
        throw new Error(
          'La disponibilidad no corresponde al día de la semana de la fecha seleccionada',
        );
      }

      // Validar que la hora encaje con el tramo
      const hi = disponibilidad.horario.horaInicio; // "18:00"
      const hhmm = fecha.toFormat('HH:mm');
      if (hhmm !== hi) {
        throw new Error(`La reserva debe iniciar a las ${hi}`);
      }

      // Deudas impagas
      const deudasImpagas = await deudaRepo.find({
        where: { persona: { id: personaId }, pagada: false },
      });
      if (deudasImpagas.length > 0) {
        const total = deudasImpagas.reduce(
          (sum, d) => sum + Number(d.monto),
          0,
        );
        throw new Error(
          `La persona tiene ${deudasImpagas.length} deuda(s) pendiente(s) por un total de $${total.toFixed(
            2,
          )}`,
        );
      }

      // Doble booking (misma disponibilidad y misma fecha)
      const clash = await reservaRepo.findOne({
        where: {
          disponibilidad: { id: disponibilidadId },
          fechaHora: fecha.toJSDate(),
        },
      });
      if (clash) {
        throw new Error('Ya existe una reserva para esa cancha, fecha y horario');
      }

      const reserva = reservaRepo.create({
        fechaHora: fecha.toJSDate(),
        creadaEl: new Date(),
        estado: EstadoReserva.Pendiente,
        persona,
        disponibilidad,
      });
      const creada = await reservaRepo.save(reserva);

      await auditoriaService.registrar({
        usuarioId,
        accion: 'crear_reserva',
        descripcion: `Persona ${persona.nombre} ${persona.apellido} creó una reserva en cancha ${disponibilidad.cancha.nombre}`,
        entidad: 'reserva',
        entidadId: creada.id,
      });

      return creada;
    });
  }

  // 🔄 Actualizar una reserva pendiente (cambio de fecha/disponibilidad)
  async actualizarReserva(
    id: string,
    dto: { disponibilidadId?: string; fechaHora?: string },
    usuarioId: string,
  ) {
    const reservaRepo = AppDataSource.getRepository(Reserva);
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const disponibilidadRepo = AppDataSource.getRepository(DisponibilidadHorario);

    const reserva = await reservaRepo.findOne({
      where: { id },
      relations: [
        'persona',
        'disponibilidad',
        'disponibilidad.cancha',
        'disponibilidad.horario',
      ],
    });
    if (!reserva) throw new Error('Reserva no encontrada');

    // Solo reservas pendientes se pueden modificar
    if (reserva.estado !== EstadoReserva.Pendiente) {
      throw new Error('Solo se pueden modificar reservas pendientes');
    }

    // permisos: admin o dueño
    const user = await usuarioRepo.findOne({
      where: { id: usuarioId },
      relations: ['rol', 'persona'],
    });
    const isAdmin = user?.rol?.nombre === 'admin';
    const isOwner = user?.persona?.id === reserva.persona.id;
    if (!isAdmin && !isOwner) {
      throw new Error('No tienes permiso para modificar esta reserva');
    }

    // Tomamos disponibilidad y fecha actuales como base
    const nuevaDisponibilidadId =
      dto.disponibilidadId ?? reserva.disponibilidad.id;

    const disponibilidad = await disponibilidadRepo.findOne({
      where: { id: nuevaDisponibilidadId },
      relations: ['cancha', 'horario'],
    });
    if (!disponibilidad) throw new Error('Disponibilidad no encontrada');
    if (!disponibilidad.disponible) {
      throw new Error('El horario está marcado como no disponible');
    }

    // Fecha: si no viene, usamos la actual de la reserva
    const fechaBaseISO =
      dto.fechaHora ??
      DateTime.fromJSDate(reserva.fechaHora, {
        zone: 'America/Argentina/Cordoba',
      }).toISO();

    const fecha = DateTime.fromISO(fechaBaseISO!, {
      zone: 'America/Argentina/Cordoba',
    });
    if (!fecha.isValid) throw new Error('fechaHora inválida');

    const diaSemana = fecha.weekday % 7;
    if (disponibilidad.diaSemana !== diaSemana) {
      throw new Error(
        'La disponibilidad no corresponde al día de la semana de la fecha seleccionada',
      );
    }

    const hi = disponibilidad.horario.horaInicio;
    const hhmm = fecha.toFormat('HH:mm');
    if (hhmm !== hi) {
      throw new Error(`La reserva debe iniciar a las ${hi}`);
    }

    // Evitar doble booking (excluyendo la propia reserva)
    const clash = await reservaRepo.findOne({
      where: {
        disponibilidad: { id: nuevaDisponibilidadId },
        fechaHora: fecha.toJSDate(),
      },
    });

    if (clash && clash.id !== reserva.id) {
      throw new Error('Ya existe una reserva para esa cancha, fecha y horario');
    }

    // Aplicar cambios
    reserva.disponibilidad = disponibilidad;
    reserva.fechaHora = fecha.toJSDate();

    const actualizada = await reservaRepo.save(reserva);

    await auditoriaService.registrar({
      usuarioId,
      accion: 'modificar_reserva',
      descripcion: `Reserva modificada por ${reserva.persona.nombre} ${reserva.persona.apellido} en cancha ${disponibilidad.cancha.nombre}`,
      entidad: 'reserva',
      entidadId: actualizada.id,
    });

    return actualizada;
  }

  async confirmarReserva(id: string, usuarioId: string) {
    const reservaRepo = AppDataSource.getRepository(Reserva);
    const usuarioRepo = AppDataSource.getRepository(Usuario);

    const reserva = await reservaRepo.findOne({
      where: { id },
      relations: ['persona', 'disponibilidad', 'disponibilidad.cancha'],
    });
    if (!reserva) throw new Error('Reserva no encontrada');

    // permisos: admin o dueño
    if (usuarioId) {
      const user = await usuarioRepo.findOne({
        where: { id: usuarioId },
        relations: ['rol', 'persona'],
      });
      const isAdmin = user?.rol?.nombre === 'admin';
      const isOwner = user?.persona?.id === reserva.persona.id;
      if (!isAdmin && !isOwner) {
        throw new Error('No tienes permiso para confirmar esta reserva');
      }
    }

    // acá aplico patrón State
    const state = crearStateParaReserva(reserva);
    state.confirmar(reserva);

    const actualizada = await reservaRepo.save(reserva);

    await auditoriaService.registrar({
      usuarioId,
      accion: 'confirmar_reserva',
      descripcion: `Reserva confirmada por ${reserva.persona.nombre} ${reserva.persona.apellido} en cancha ${reserva.disponibilidad.cancha.nombre}`,
      entidad: 'reserva',
      entidadId: actualizada.id,
    });

    return actualizada;
  }

    async cancelarReserva(id: string, usuarioId: string) {
    const reservaRepo = AppDataSource.getRepository(Reserva);
    const usuarioRepo = AppDataSource.getRepository(Usuario);

    const reserva = await reservaRepo.findOne({
      where: { id },
      relations: ['persona', 'disponibilidad', 'disponibilidad.cancha'],
    });
    if (!reserva) throw new Error('Reserva no encontrada');

    if (usuarioId) {
      const user = await usuarioRepo.findOne({
        where: { id: usuarioId },
        relations: ['rol', 'persona'],
      });
      const isAdmin = user?.rol?.nombre === 'admin';
      const isOwner = user?.persona?.id === reserva.persona.id;
      if (!isAdmin && !isOwner) {
        throw new Error('No tienes permiso para cancelar esta reserva');
      }
    }

    // acá aplico patrón State
    const state = crearStateParaReserva(reserva);
    state.cancelar(reserva);

    const actualizada = await reservaRepo.save(reserva);

    await auditoriaService.registrar({
      usuarioId,
      accion: 'cancelar_reserva',
      descripcion: `Reserva cancelada por ${reserva.persona.nombre} ${reserva.persona.apellido} en cancha ${reserva.disponibilidad.cancha.nombre}`,
      entidad: 'reserva',
      entidadId: actualizada.id,
    });

    return actualizada;
  }


  async obtenerTodas() {
    return await AppDataSource.getRepository(Reserva).find({
      relations: [
        'persona',
        'disponibilidad',
        'disponibilidad.cancha',
        'disponibilidad.horario',
      ],
      order: { fechaHora: 'DESC' },
    });
  }

  async obtenerPorId(id: string) {
    const reserva = await AppDataSource.getRepository(Reserva).findOne({
      where: { id },
      relations: [
        'persona',
        'disponibilidad',
        'disponibilidad.cancha',
        'disponibilidad.horario',
      ],
    });
    if (!reserva) throw new Error('Reserva no encontrada');
    return reserva;
  }
}

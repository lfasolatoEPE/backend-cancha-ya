import { AppDataSource } from '../../database/data-source';
import { Reserva, EstadoReserva } from '../../entities/Reserva.entity';
import { Persona } from '../../entities/Persona.entity';
import { Deuda } from '../../entities/Deuda.entity';
import { DisponibilidadHorario } from '../../entities/DisponibilidadHorario.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';

import { NotifsService } from '../notifs/notifs.service';
import { tplReservaCreada } from '../../templates/reserva-creada';
import { DateTime } from 'luxon';
import { Usuario } from '../../entities/Usuario.entity';
import { EmailService } from '../../providers/email.service';

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
      if (!disponibilidad.disponible) throw new Error('El horario está marcado como no disponible');

      // Parseo horario con tz local AR (ajustá si querés UTC)
      const fecha = DateTime.fromISO(fechaHora, { zone: 'America/Argentina/Cordoba' });
      if (!fecha.isValid) throw new Error('fechaHora inválida');

      const diaSemana = fecha.weekday % 7; // Luxon: 1=lun..7=dom → %7 hace dom=0
      if (disponibilidad.diaSemana !== diaSemana) {
        throw new Error('La disponibilidad no corresponde al día de la semana de la fecha seleccionada');
      }

      // Validar que la hora encaje con el tramo
      const hi = disponibilidad.horario.horaInicio; // "18:00"
      const hf = disponibilidad.horario.horaFin;    // "19:00"
      const hhmm = fecha.toFormat('HH:mm');
      if (hhmm !== hi) {
        throw new Error(`La reserva debe iniciar a las ${hi}`);
      }

      // Deudas impagas
      const deudasImpagas = await deudaRepo.find({ where: { persona: { id: personaId }, pagada: false } });
      if (deudasImpagas.length > 0) {
        const total = deudasImpagas.reduce((sum, d) => sum + Number(d.monto), 0);
        throw new Error(`La persona tiene ${deudasImpagas.length} deuda(s) pendiente(s) por un total de $${total.toFixed(2)}`);
      }

      // Doble booking (misma disponibilidad y misma fecha)
      const clash = await reservaRepo.findOne({
        where: { disponibilidad: { id: disponibilidadId }, fechaHora: fecha.toJSDate() },
      });
      if (clash) throw new Error('Ya existe una reserva para esa cancha, fecha y horario');

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
      const user = await usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol', 'persona'] });
      const isAdmin = user?.rol?.nombre === 'admin';
      const isOwner = user?.persona?.id === reserva.persona.id;
      if (!isAdmin && !isOwner) {
        throw new Error('No tienes permiso para confirmar esta reserva');
      }
    }

    reserva.estado = EstadoReserva.Confirmada;
    const actualizada = await reservaRepo.save(reserva);

    await auditoriaService.registrar({
      usuarioId,
      accion: 'confirmar_reserva',
      descripcion: `Reserva confirmada por ${reserva.persona.nombre} ${reserva.persona.apellido} en cancha ${reserva.disponibilidad.cancha.nombre}`,
      entidad: 'reserva',
      entidadId: actualizada.id,
    });

    // Notificaciones (igual a tu versión)
    try {
      const notifs = new NotifsService(AppDataSource);
      const inicio = DateTime.fromJSDate(reserva.fechaHora, { zone: 'America/Argentina/Cordoba' });
      const fechaHumana = inicio.toFormat("cccc dd 'de' LLLL 'a las' HH:mm");

      const cancha = reserva.disponibilidad?.cancha?.nombre ?? 'Cancha';
      const club = (reserva as any)?.disponibilidad?.cancha?.club?.nombre ?? 'Tu club';

      const usuarioReserva = await usuarioRepo.findOne({
        where: { persona: { id: reserva.persona.id } },
        relations: ['persona'],
      });

      const tpl = tplReservaCreada({ fechaHumana, club, cancha });

      if (usuarioReserva?.id) {
        await notifs.sendEmailToUser(usuarioReserva.id, tpl.subject, tpl.html, tpl.text);
        const inicioISO = inicio.toISO()!;
        await notifs.scheduleReservaReminder(
          usuarioReserva.id,
          { reservaId: reserva.id, fechaISO: inicioISO, club, cancha },
          inicio.minus({ hours: 24 }).toISO()!
        );
        await notifs.scheduleReservaReminder(
          usuarioReserva.id,
          { reservaId: reserva.id, fechaISO: inicioISO, club, cancha },
          inicio.minus({ hours: 1 }).toISO()!
        );
      } else if (reserva.persona?.email) {
        await EmailService.send({ to: reserva.persona.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
      }
    } catch (err) {
      console.error('❌ Error enviando notificaciones:', err);
    }

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
      const user = await usuarioRepo.findOne({ where: { id: usuarioId }, relations: ['rol', 'persona'] });
      const isAdmin = user?.rol?.nombre === 'admin';
      const isOwner = user?.persona?.id === reserva.persona.id;
      if (!isAdmin && !isOwner) {
        throw new Error('No tienes permiso para cancelar esta reserva');
      }
    }

    reserva.estado = EstadoReserva.Cancelada;
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
      relations: ['persona', 'disponibilidad', 'disponibilidad.cancha', 'disponibilidad.horario'],
      order: { fechaHora: 'DESC' },
    });
  }

  async obtenerPorId(id: string) {
    const reserva = await AppDataSource.getRepository(Reserva).findOne({
      where: { id },
      relations: ['persona', 'disponibilidad', 'disponibilidad.cancha', 'disponibilidad.horario'],
    });
    if (!reserva) throw new Error('Reserva no encontrada');
    return reserva;
  }
}

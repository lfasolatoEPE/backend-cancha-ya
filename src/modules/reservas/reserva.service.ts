import { AppDataSource } from '../../database/data-source';
import { Reserva, EstadoReserva } from '../../entities/Reserva.entity';
import { Persona } from '../../entities/Persona.entity';
import { Deuda } from '../../entities/Deuda.entity';
import { DisponibilidadHorario } from '../../entities/DisponibilidadHorario.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';

// 👇 imports para notifs
import { NotifsService } from '../notifs/notifs.service';
import { tplReservaCreada } from '../../templates/reserva-creada';
import { DateTime } from 'luxon';
import { Usuario } from '../../entities/Usuario.entity';
import { EmailService } from '../../providers/email.service';

const reservaRepo = AppDataSource.getRepository(Reserva);
const personaRepo = AppDataSource.getRepository(Persona);
const deudaRepo = AppDataSource.getRepository(Deuda);
const disponibilidadRepo = AppDataSource.getRepository(DisponibilidadHorario);
const usuarioRepo = AppDataSource.getRepository(Usuario);

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
      relations: [
        'persona',
        'disponibilidad',
        'disponibilidad.cancha',
        // 'disponibilidad.cancha.club', // si tenés club relacionado, podés incluirlo
        // 'disponibilidad.horario',     // no es estrictamente necesario para el mail
      ]
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

    // ───────────── Notificaciones ─────────────
    try {
      const notifs = new NotifsService(AppDataSource);

      // Formato humano AR
      const inicio = DateTime.fromJSDate(reserva.fechaHora, { zone: 'America/Argentina/Cordoba' });
      const fechaHumana = inicio.toFormat("cccc dd 'de' LLLL 'a las' HH:mm");

      const cancha = reserva.disponibilidad?.cancha?.nombre ?? 'Cancha';
      const club =
        (reserva as any)?.disponibilidad?.cancha?.club?.nombre ??
        'Tu club';

      // buscamos el usuario dueño de esta reserva (por la persona vinculada)
      const usuarioReserva = await usuarioRepo.findOne({
        where: { persona: { id: reserva.persona.id } },
        relations: ['persona'],
      });

      const tpl = tplReservaCreada({ fechaHumana, club, cancha });

      if (usuarioReserva?.id) {
        // 1) Mail inmediato a suscripciones del usuario
        await notifs.sendEmailToUser(usuarioReserva.id, tpl.subject, tpl.html, tpl.text);

        // 2) Recordatorios (24h y 1h antes). Si el tiempo ya pasó, el job corre ASAP.
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
      } else {
        // Fallback: si no hay Usuario asociado a esta Persona, enviamos directo por email si existe,
        // pero NO se programan recordatorios (porque dependen de userId/subs).
        const to = reserva.persona?.email;
        if (to) {
          await EmailService.send({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
          console.warn('⚠️ No se encontró Usuario vinculado a la Persona; se envió mail directo y NO se agendaron recordatorios.');
        } else {
          console.warn('⚠️ Persona sin email y sin Usuario vinculado: no se pudo notificar.');
        }
      }
    } catch (err) {
      console.error('❌ Error enviando notificaciones de reserva confirmada:', err);
      // no interrumpe el flujo de confirmación
    }
    // ─────────────────────────────────────────

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

    // (opcional) enviar notificación de cancelación aquí

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

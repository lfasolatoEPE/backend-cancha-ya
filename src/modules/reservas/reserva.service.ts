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
type ActorContext = {
  actorUsuarioId: string;
  actorPersonaId?: string;
  actorNivelAcceso: 'usuario' | 'admin-club' | 'admin';
  actorClubIds: string[];
};

export class ReservaService {
  private puedeGestionarReserva(ctx: ActorContext, reserva: Reserva): boolean {
    // admin global
    if (ctx.actorNivelAcceso === 'admin') return true;

    // admin-club: solo si la reserva pertenece a alguno de sus clubes
    if (ctx.actorNivelAcceso === 'admin-club') {
      const clubId = reserva.disponibilidad?.cancha?.club?.id;
      return !!clubId && ctx.actorClubIds.includes(clubId);
    }

    // usuario: solo dueño
    return !!ctx.actorPersonaId && reserva.persona?.id === ctx.actorPersonaId;
  }

  private puedeCrearEnDisponibilidad(ctx: ActorContext, disponibilidad: DisponibilidadHorario): boolean {
    if (ctx.actorNivelAcceso === 'admin') return true;
    if (ctx.actorNivelAcceso === 'admin-club') {
      const clubId = disponibilidad?.cancha?.club?.id;
      return !!clubId && ctx.actorClubIds.includes(clubId);
    }
    return true; // usuario normal puede crear (se valida por deudas etc.)
  }

  async crearReserva(dto: {
    actorUsuarioId: string;
    actorNivelAcceso: 'usuario' | 'admin-club' | 'admin';
    actorClubIds: string[];
    personaId: string;
    disponibilidadId: string;
    fechaHora: string;
  }) {
    const { actorUsuarioId, actorNivelAcceso, actorClubIds, personaId, disponibilidadId, fechaHora } = dto;

    return await AppDataSource.transaction(async (manager) => {
      const reservaRepo = manager.getRepository(Reserva);
      const personaRepo = manager.getRepository(Persona);
      const deudaRepo = manager.getRepository(Deuda);
      const disponibilidadRepo = manager.getRepository(DisponibilidadHorario);

      const persona = await personaRepo.findOne({ where: { id: personaId } });
      if (!persona) throw new Error('Persona no encontrada');

      const disponibilidad = await disponibilidadRepo.findOne({
        where: { id: disponibilidadId },
        relations: ['cancha', 'cancha.club', 'horario'],
      });
      if (!disponibilidad) throw new Error('Disponibilidad no encontrada');
      if (!disponibilidad.disponible) throw new Error('El horario está marcado como no disponible');

      // ✅ Scope: admin-club solo en sus clubes
      const ctx: ActorContext = {
        actorUsuarioId,
        actorNivelAcceso,
        actorClubIds,
        actorPersonaId: undefined,
      };
      if (!this.puedeCrearEnDisponibilidad(ctx, disponibilidad)) {
        throw new Error('No tienes permiso para crear reservas en este club');
      }

      const fecha = DateTime.fromISO(fechaHora, { zone: 'America/Argentina/Cordoba' });
      if (!fecha.isValid) throw new Error('fechaHora inválida');

      const diaSemana = fecha.weekday % 7;
      if (disponibilidad.diaSemana !== diaSemana) {
        throw new Error('La disponibilidad no corresponde al día de la semana de la fecha seleccionada');
      }

      const hi = disponibilidad.horario.horaInicio;
      const hhmm = fecha.toFormat('HH:mm');
      if (hhmm !== hi) throw new Error(`La reserva debe iniciar a las ${hi}`);

      // deudas impagas (si querés que admin/admin-club puedan saltear esto, decímelo)
      const deudasImpagas = await deudaRepo.find({
        where: { persona: { id: personaId }, pagada: false },
      });
      if (deudasImpagas.length > 0) {
        const total = deudasImpagas.reduce((sum, d) => sum + Number(d.monto), 0);
        throw new Error(`La persona tiene ${deudasImpagas.length} deuda(s) pendiente(s) por un total de $${total.toFixed(2)}`);
      }

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
        usuarioId: actorUsuarioId,
        accion: 'crear_reserva',
        descripcion: `Reserva creada (${actorNivelAcceso}) para ${persona.nombre} ${persona.apellido} en cancha ${disponibilidad.cancha.nombre}`,
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
        'disponibilidad.cancha.club',
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
      relations: ['rol', 'persona', 'adminClubs'],
    });
    if (!user?.rol?.nivelAcceso) throw new Error('Usuario sin nivelAcceso');

    const ctx: ActorContext = {
      actorUsuarioId: usuarioId,
      actorPersonaId: user.persona?.id,
      actorNivelAcceso: user.rol.nivelAcceso,
      actorClubIds: (user.adminClubs ?? []).map(c => c.id),
    };

    if (!this.puedeGestionarReserva(ctx, reserva)) {
      throw new Error('No tienes permiso para gestionar esta reserva');
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
      relations: [
        'persona',
        'disponibilidad',
        'disponibilidad.cancha',
        'disponibilidad.cancha.club',
        'disponibilidad.horario',
      ],
    });
    if (!reserva) throw new Error('Reserva no encontrada');

    // permisos: admin o dueño
    if (usuarioId) {
      const user = await usuarioRepo.findOne({
        where: { id: usuarioId },
        relations: ['rol', 'persona', 'adminClubs'],
      });
      if (!user?.rol?.nivelAcceso) throw new Error('Usuario sin nivelAcceso');

      const ctx: ActorContext = {
        actorUsuarioId: usuarioId,
        actorPersonaId: user.persona?.id,
        actorNivelAcceso: user.rol.nivelAcceso,
        actorClubIds: (user.adminClubs ?? []).map(c => c.id),
      };

      if (!this.puedeGestionarReserva(ctx, reserva)) {
        throw new Error('No tienes permiso para gestionar esta reserva');
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
    const disponibilidadRepo = AppDataSource.getRepository(DisponibilidadHorario);

    const reserva = await reservaRepo.findOne({
      where: { id },
      relations: [
        'persona',
        'disponibilidad',
        'disponibilidad.cancha',
        'disponibilidad.cancha.club',
        'disponibilidad.horario',
      ],
    });
    if (!reserva) throw new Error('Reserva no encontrada');

    if (usuarioId) {
      const user = await usuarioRepo.findOne({
        where: { id: usuarioId },
        relations: ['rol', 'persona', 'adminClubs'],
      });
      if (!user?.rol?.nivelAcceso) throw new Error('Usuario sin nivelAcceso');

      const ctx: ActorContext = {
        actorUsuarioId: usuarioId,
        actorPersonaId: user.persona?.id,
        actorNivelAcceso: user.rol.nivelAcceso,
        actorClubIds: (user.adminClubs ?? []).map(c => c.id),
      };

      if (!this.puedeGestionarReserva(ctx, reserva)) {
        throw new Error('No tienes permiso para gestionar esta reserva');
      }
    }

    // acá aplico patrón State
    const state = crearStateParaReserva(reserva);
    state.cancelar(reserva);
    reserva.disponibilidad.disponible = true;
    await disponibilidadRepo.save(reserva.disponibilidad);
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

  async obtenerTodas(ctx: ActorContext) {
    const qb = AppDataSource.getRepository(Reserva)
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.persona', 'p')
      .leftJoinAndSelect('r.disponibilidad', 'd')
      .leftJoinAndSelect('d.cancha', 'c')
      .leftJoinAndSelect('c.club', 'cl')
      .leftJoinAndSelect('d.horario', 'h')
      .orderBy('r.fechaHora', 'DESC');

    if (ctx.actorNivelAcceso === 'admin-club') {
      qb.where('cl.id IN (:...clubIds)', { clubIds: ctx.actorClubIds });
    } else if (ctx.actorNivelAcceso === 'usuario') {
      qb.where('p.id = :personaId', { personaId: ctx.actorPersonaId });
    }

    return qb.getMany();
  }

  async obtenerPorId(id: string, ctx: ActorContext) {
    const reserva = await AppDataSource.getRepository(Reserva).findOne({
      where: { id },
      relations: [
        'persona',
        'disponibilidad',
        'disponibilidad.cancha',
        'disponibilidad.cancha.club',
        'disponibilidad.horario',
      ],
    });
    if (!reserva) throw new Error('Reserva no encontrada');

    if (!this.puedeGestionarReserva(ctx, reserva)) {
      throw new Error('No tienes permiso para ver esta reserva');
    }
    return reserva;
  }
}
import { AppDataSource } from '../../database/data-source';
import { Reserva, EstadoReserva } from '../../entities/Reserva.entity';
import { Persona } from '../../entities/Persona.entity';
import { Deuda } from '../../entities/Deuda.entity';
import { DisponibilidadHorario } from '../../entities/DisponibilidadHorario.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { DateTime } from 'luxon';
import { Usuario } from '../../entities/Usuario.entity';
import { crearStateParaReserva } from './state/reserva-state.factory';
import { NivelAcceso } from '../../entities/Rol.entity';

const auditoriaService = new AuditoriaService();

type ActorContext = {
  actorUsuarioId: string;
  actorPersonaId?: string;
  actorNivelAcceso: NivelAcceso;
  actorClubIds: string[];
};

type FiltrosListado = {
  from?: string;
  to?: string;
  clubId?: string;
  canchaId?: string;
  estado?: EstadoReserva;
};

function hasScopedClubs(clubIds?: string[]) {
  return Array.isArray(clubIds) && clubIds.length > 0;
}

export class ReservaService {
  private puedeGestionarReserva(ctx: ActorContext, reserva: Reserva): boolean {
    if (ctx.actorNivelAcceso === NivelAcceso.Admin) return true;

    if (ctx.actorNivelAcceso === NivelAcceso.AdminClub) {
      const clubId = reserva.disponibilidad?.cancha?.club?.id;
      return !!clubId && ctx.actorClubIds.includes(clubId);
    }

    return !!ctx.actorPersonaId && reserva.persona?.id === ctx.actorPersonaId;
  }

  private puedeCrearEnDisponibilidad(ctx: ActorContext, disponibilidad: DisponibilidadHorario): boolean {
    if (ctx.actorNivelAcceso === NivelAcceso.Admin) return true;
    if (ctx.actorNivelAcceso === NivelAcceso.AdminClub) {
      const clubId = disponibilidad?.cancha?.club?.id;
      return !!clubId && ctx.actorClubIds.includes(clubId);
    }
    return true;
  }

  async crearReserva(dto: {
    actorUsuarioId: string;
    actorNivelAcceso: NivelAcceso;
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

      const deudasImpagas = await deudaRepo.find({
        where: { persona: { id: personaId }, pagada: false },
      });
      if (deudasImpagas.length > 0) {
        const total = deudasImpagas.reduce((sum, d) => sum + Number(d.monto), 0);
        throw new Error(
          `La persona tiene ${deudasImpagas.length} deuda(s) pendiente(s) por un total de $${total.toFixed(2)}`
        );
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

  // ✅ ahora recibe ctx completo (no solo usuarioId)
  async actualizarReserva(id: string, dto: { disponibilidadId?: string; fechaHora?: string }, ctx: ActorContext) {
    const reservaRepo = AppDataSource.getRepository(Reserva);
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

    if (reserva.estado !== EstadoReserva.Pendiente) {
      throw new Error('Solo se pueden modificar reservas pendientes');
    }

    if (!this.puedeGestionarReserva(ctx, reserva)) {
      throw new Error('No tienes permiso para gestionar esta reserva');
    }

    const nuevaDisponibilidadId = dto.disponibilidadId ?? reserva.disponibilidad.id;

    const disponibilidad = await disponibilidadRepo.findOne({
      where: { id: nuevaDisponibilidadId },
      relations: ['cancha', 'cancha.club', 'horario'],
    });
    if (!disponibilidad) throw new Error('Disponibilidad no encontrada');
    if (!disponibilidad.disponible) throw new Error('El horario está marcado como no disponible');

    // 🔐 admin-club no puede mover a otra cancha fuera de su scope
    if (ctx.actorNivelAcceso === NivelAcceso.AdminClub) {
      const clubId = disponibilidad?.cancha?.club?.id;
      if (!clubId || !ctx.actorClubIds.includes(clubId)) {
        throw new Error('No puedes mover la reserva a una cancha fuera de tus clubes');
      }
    }

    const fechaBaseISO =
      dto.fechaHora ??
      DateTime.fromJSDate(reserva.fechaHora, { zone: 'America/Argentina/Cordoba' }).toISO();

    const fecha = DateTime.fromISO(fechaBaseISO!, { zone: 'America/Argentina/Cordoba' });
    if (!fecha.isValid) throw new Error('fechaHora inválida');

    const diaSemana = fecha.weekday % 7;
    if (disponibilidad.diaSemana !== diaSemana) {
      throw new Error('La disponibilidad no corresponde al día de la semana de la fecha seleccionada');
    }

    const hi = disponibilidad.horario.horaInicio;
    const hhmm = fecha.toFormat('HH:mm');
    if (hhmm !== hi) throw new Error(`La reserva debe iniciar a las ${hi}`);

    const clash = await reservaRepo.findOne({
      where: { disponibilidad: { id: nuevaDisponibilidadId }, fechaHora: fecha.toJSDate() },
    });
    if (clash && clash.id !== reserva.id) {
      throw new Error('Ya existe una reserva para esa cancha, fecha y horario');
    }

    reserva.disponibilidad = disponibilidad;
    reserva.fechaHora = fecha.toJSDate();

    const actualizada = await reservaRepo.save(reserva);

    await auditoriaService.registrar({
      usuarioId: ctx.actorUsuarioId,
      accion: 'modificar_reserva',
      descripcion: `Reserva modificada por usuario ${ctx.actorUsuarioId} en cancha ${disponibilidad.cancha.nombre}`,
      entidad: 'reserva',
      entidadId: actualizada.id,
    });

    return actualizada;
  }

  async confirmarReserva(id: string, ctx: ActorContext) {
    const reservaRepo = AppDataSource.getRepository(Reserva);

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

    if (!this.puedeGestionarReserva(ctx, reserva)) {
      throw new Error('No tienes permiso para gestionar esta reserva');
    }

    const state = crearStateParaReserva(reserva);
    state.confirmar(reserva);

    const actualizada = await reservaRepo.save(reserva);

    await auditoriaService.registrar({
      usuarioId: ctx.actorUsuarioId,
      accion: 'confirmar_reserva',
      descripcion: `Reserva confirmada en cancha ${reserva.disponibilidad.cancha.nombre}`,
      entidad: 'reserva',
      entidadId: actualizada.id,
    });

    return actualizada;
  }

  async cancelarReserva(id: string, ctx: ActorContext) {
    const reservaRepo = AppDataSource.getRepository(Reserva);
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

    if (!this.puedeGestionarReserva(ctx, reserva)) {
      throw new Error('No tienes permiso para gestionar esta reserva');
    }

    const state = crearStateParaReserva(reserva);
    state.cancelar(reserva);

    // ⚠️ OJO: esto es discutible.
    // disponibilidad.disponible suele ser "patrón semanal", no "slot de reserva".
    // Te lo dejo como lo tenías, pero lo ideal es NO tocar dh.disponible acá.
    // reserva.disponibilidad.disponible = true;
    // await disponibilidadRepo.save(reserva.disponibilidad);

    const actualizada = await reservaRepo.save(reserva);

    await auditoriaService.registrar({
      usuarioId: ctx.actorUsuarioId,
      accion: 'cancelar_reserva',
      descripcion: `Reserva cancelada en cancha ${reserva.disponibilidad.cancha.nombre}`,
      entidad: 'reserva',
      entidadId: actualizada.id,
    });

    return actualizada;
  }

  async obtenerMisReservas(ctx: ActorContext) {
    if (!ctx.actorPersonaId) throw new Error('Falta personaId en token');

    return this.obtenerTodas(
      { ...ctx, actorNivelAcceso: NivelAcceso.Usuario },
      {}
    );
  }

  async obtenerTodas(ctx: ActorContext, filtros: FiltrosListado = {}) {
    const qb = AppDataSource.getRepository(Reserva)
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.persona', 'p')
      .leftJoinAndSelect('r.disponibilidad', 'd')
      .leftJoinAndSelect('d.cancha', 'c')
      .leftJoinAndSelect('c.club', 'cl')
      .leftJoinAndSelect('d.horario', 'h')
      .orderBy('r.fechaHora', 'DESC');

    // filtros opcionales
    if (filtros.from) qb.andWhere(`r."fechaHora" >= :from`, { from: filtros.from });
    if (filtros.to) qb.andWhere(`r."fechaHora" <  :to`, { to: filtros.to });
    if (filtros.estado) qb.andWhere(`r.estado = :estado`, { estado: filtros.estado });
    if (filtros.canchaId) qb.andWhere(`c.id = :canchaId`, { canchaId: filtros.canchaId });

    // 🔐 scope por rol
    if (ctx.actorNivelAcceso === NivelAcceso.Admin) {
      if (filtros.clubId) qb.andWhere('cl.id = :clubId', { clubId: filtros.clubId });
      return qb.getMany();
    }

    if (ctx.actorNivelAcceso === NivelAcceso.AdminClub) {
      // admin-club sin clubes -> vacío (no 500, no data leak)
      if (!hasScopedClubs(ctx.actorClubIds)) return [];

      if (filtros.clubId) {
        // si el front intenta pasar un clubId fuera del scope → vacío
        if (!ctx.actorClubIds.includes(filtros.clubId)) return [];
        qb.andWhere('cl.id = :clubId', { clubId: filtros.clubId });
      } else {
        qb.andWhere('cl.id IN (:...clubIds)', { clubIds: ctx.actorClubIds });
      }
      return qb.getMany();
    }

    // usuario normal
    if (!ctx.actorPersonaId) throw new Error('Falta personaId en token');
    qb.andWhere('p.id = :personaId', { personaId: ctx.actorPersonaId });
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

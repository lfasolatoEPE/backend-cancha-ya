import { AppDataSource } from '../../database/data-source';
import { Reserva } from '../../entities/Reserva.entity';
import { Cancha } from '../../entities/Cancha.entity';
import { Usuario } from '../../entities/Usuario.entity';
import { Deuda } from '../../entities/Deuda.entity';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { DateTime } from 'luxon';

const reservaRepo = AppDataSource.getRepository(Reserva);
const canchaRepo  = AppDataSource.getRepository(Cancha);
const deudaRepo   = AppDataSource.getRepository(Deuda);
const perfilRepo  = AppDataSource.getRepository(PerfilCompetitivo);
const usuarioRepo = AppDataSource.getRepository(Usuario);

type Range = {
  from?: string; to?: string; tz?: string;
  granularity?: 'day'|'week'|'month';
  clubId?: string; canchaId?: string; estado?: 'pendiente'|'confirmada'|'cancelada';
  by?: 'club'|'cancha';
  level?: 'club'|'cancha'|'detalle';
  // 🔐 alcance de admin-club
  clubIds?: string[];
};

type Scope = { clubIds?: string[] };

function hasScopedClubs(clubIds?: string[]) {
  return Array.isArray(clubIds) && clubIds.length > 0;
}

export class AdminService {
  // ————————————————— RESUMEN GENERAL —————————————————

  async obtenerResumenGeneral({ clubIds }: Scope = {}) {
    // Admin-club sin clubes asignados → todo en 0
    if (clubIds && clubIds.length === 0) {
      return {
        totalUsuarios: 0,
        totalReservas: 0,
        totalCanchas: 0,
        deudaTotalPendiente: 0,
      };
    }

    // Admin global → métricas de toda la plataforma
    if (!hasScopedClubs(clubIds)) {
      const totalUsuarios = await usuarioRepo.count();
      const totalReservas = await reservaRepo.count();
      const totalCanchas  = await canchaRepo.count();
      const { total } = await deudaRepo.createQueryBuilder('d')
        .select('COALESCE(SUM(d.monto),0)','total')
        .where('d.pagada = false')
        .getRawOne();
      return {
        totalUsuarios,
        totalReservas,
        totalCanchas,
        deudaTotalPendiente: Number(total),
      };
    }

    // Admin-club → sólo info de sus clubes
    // totalCanchas: canchas de esos clubes
    const totalCanchas = await canchaRepo.createQueryBuilder('c')
      .leftJoin('c.club','club')
      .where('club.id IN (:...clubIds)', { clubIds })
      .getCount();

    // totalReservas y usuarios que reservaron en esos clubes
    const reservasRows = await reservaRepo.createQueryBuilder('r')
      .leftJoin('r.disponibilidad','d')
      .leftJoin('d.cancha','c')
      .leftJoin('c.club','club')
      .leftJoin('r.persona','p')
      .select('COUNT(r.id)','totalReservas')
      .addSelect('COUNT(DISTINCT p.id)','totalPersonas')
      .where('club.id IN (:...clubIds)', { clubIds })
      .getRawOne();

    const totalReservas = Number(reservasRows.totalReservas || 0);
    const totalUsuarios = Number(reservasRows.totalPersonas || 0);

    // deuda: de esas personas solamente
    const deudaRow = await deudaRepo.createQueryBuilder('d')
      .leftJoin('d.persona','p')
      .where('d.pagada = false')
      .andWhere('p.id IN ' +
        reservaRepo.createQueryBuilder('r2')
          .leftJoin('r2.disponibilidad','d2')
          .leftJoin('d2.cancha','c2')
          .leftJoin('c2.club','club2')
          .select('r2."personaId"')
          .where('club2.id IN (:...clubIds)', { clubIds })
          .getQuery()
      )
      .setParameters({ clubIds })
      .select('COALESCE(SUM(d.monto),0)','total')
      .getRawOne();

    return {
      totalUsuarios,
      totalReservas,
      totalCanchas,
      deudaTotalPendiente: Number(deudaRow.total || 0),
    };
  }

  // ————————————————— TOP JUGADORES —————————————————
  // (por ahora sin filtro por club: ranking global)

  async obtenerTopJugadores(_opts: Range = {}) {
    const qb = perfilRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.usuario','u')
      .leftJoinAndSelect('u.persona','per')
      .orderBy('p.ranking','DESC')
      .take(10);
    return (await qb.getMany()).map(p => ({
      personaId: p.usuario.persona.id,
      nombre: p.usuario.persona.nombre,
      email: p.usuario.persona.email,
      ranking: p.ranking
    }));
  }

  // ————————————————— CANCHAS MÁS USADAS —————————————————

  async obtenerCanchasMasUsadas({ from, to, tz = 'America/Argentina/Cordoba', clubId, clubIds }: Range = {}) {
    const params: any = { tz };
    let where = '1=1';

    if (from) { where += ' AND (reserva."fechaHora" AT TIME ZONE :tz) >= :from'; params.from = from; }
    if (to)   { where += ' AND (reserva."fechaHora" AT TIME ZONE :tz) <  :to';   params.to   = to; }

    // 🔐 filtro por club / clubIds
    if (hasScopedClubs(clubIds)) {
      if (clubId && clubIds!.includes(clubId)) {
        where += ' AND club.id = :clubId';
        params.clubId = clubId;
      } else {
        where += ' AND club.id IN (:...clubIds)';
        params.clubIds = clubIds;
      }
    } else if (clubId) {
      where += ' AND club.id = :clubId';
      params.clubId = clubId;
    }

    return await reservaRepo.createQueryBuilder('reserva')
      .leftJoin('reserva.disponibilidad','disp')
      .leftJoin('disp.cancha','cancha')
      .leftJoin('cancha.club','club')
      .select('cancha.id','canchaId')
      .addSelect('cancha.nombre','nombre')
      .addSelect('COUNT(reserva.id)','totalReservas')
      .where(where, params)
      .groupBy('cancha.id')
      .orderBy('"totalReservas"','DESC')
      .limit(10)
      .getRawMany();
  }

  // ————————————————— PERSONAS CON DEUDA —————————————————

  async obtenerPersonasConDeuda({ clubIds }: Scope = {}) {
    if (!hasScopedClubs(clubIds)) {
      // global
      return await deudaRepo.createQueryBuilder('d')
        .leftJoin('d.persona','p')
        .select('p.id','personaId')
        .addSelect('p.nombre','nombre')
        .addSelect('p.email','email')
        .addSelect('SUM(d.monto)','totalDeuda')
        .where('d.pagada = false')
        .groupBy('p.id')
        .orderBy('"totalDeuda"','DESC')
        .getRawMany();
    }

    // admin-club → sólo personas con reservas en sus clubes
    const rows = await deudaRepo.createQueryBuilder('d')
      .leftJoin('d.persona','p')
      .where('d.pagada = false')
      .andWhere('p.id IN ' +
        reservaRepo.createQueryBuilder('r2')
          .leftJoin('r2.disponibilidad','d2')
          .leftJoin('d2.cancha','c2')
          .leftJoin('c2.club','club2')
          .select('r2."personaId"')
          .where('club2.id IN (:...clubIds)', { clubIds })
          .getQuery()
      )
      .setParameters({ clubIds })
      .select('p.id','personaId')
      .addSelect('p.nombre','nombre')
      .addSelect('p.email','email')
      .addSelect('SUM(d.monto)','totalDeuda')
      .groupBy('p.id')
      .orderBy('"totalDeuda"','DESC')
      .getRawMany();

    return rows;
  }

  // ————————————————— HELPERS REPORTES —————————————————

  private bucketExpr(granularity: Range['granularity'], tz: string) {
    const g = granularity || 'day';
    const expr = `date_trunc('${g}', reserva."fechaHora" AT TIME ZONE :tz)`;
    return { g, expr };
  }

  // ————————————————— RESERVAS AGGREGATE —————————————————

  async reservasAggregate({
    from, to, tz = 'America/Argentina/Cordoba',
    granularity, clubId, canchaId, estado, clubIds,
  }: Range) {
    const { expr } = this.bucketExpr(granularity, tz);
    const params: any = { tz };
    let where = '1=1';
    if (from) { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) >= :from`; params.from = from; }
    if (to)   { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) <  :to`;   params.to   = to; }
    if (estado) { where += ' AND reserva.estado = :estado'; params.estado = estado; }

    // club / cancha + alcance admin-club
    if (hasScopedClubs(clubIds)) {
      if (canchaId) {
        where += ' AND cancha.id = :canchaId';
        params.canchaId = canchaId;
      } else if (clubId && clubIds!.includes(clubId)) {
        where += ' AND club.id = :clubId';
        params.clubId = clubId;
      } else {
        where += ' AND club.id IN (:...clubIds)';
        params.clubIds = clubIds;
      }
    } else {
      if (clubId) { where += ' AND club.id = :clubId'; params.clubId = clubId; }
      if (canchaId) { where += ' AND cancha.id = :canchaId'; params.canchaId = canchaId; }
    }

    const rows = await reservaRepo.createQueryBuilder('reserva')
      .leftJoin('reserva.disponibilidad','disp')
      .leftJoin('disp.cancha','cancha')
      .leftJoin('cancha.club','club')
      .select(`${expr}`,'bucket')
      .addSelect('COUNT(reserva.id)','total')
      .addSelect(`SUM(CASE WHEN reserva.estado='confirmada' THEN 1 ELSE 0 END)`,'confirmadas')
      .addSelect(`SUM(CASE WHEN reserva.estado='cancelada' THEN 1 ELSE 0 END)`,'canceladas')
      .addSelect(`SUM(CASE WHEN reserva.estado='pendiente'  THEN 1 ELSE 0 END)`,'pendientes')
      .where(where, params)
      .groupBy('bucket')
      .orderBy('bucket','ASC')
      .getRawMany();

    return rows.map(r => ({
      bucket: new Date(r.bucket).toISOString().slice(0,10),
      total: Number(r.total),
      confirmadas: Number(r.confirmadas),
      canceladas: Number(r.canceladas),
      pendientes: Number(r.pendientes),
    }));
  }

  // ————————————————— DRILLDOWN —————————————————

  async reservasDrilldown({
    level = 'club', clubId, canchaId,
    from, to, tz = 'America/Argentina/Cordoba',
    estado, clubIds,
  }: Range) {
    const params: any = { tz };
    let where = '1=1';
    if (from) { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) >= :from`; params.from = from; }
    if (to)   { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) <  :to`;   params.to   = to; }
    if (estado) { where += ' AND reserva.estado = :estado'; params.estado = estado; }

    if (level === 'club') {
      if (hasScopedClubs(clubIds)) {
        where += ' AND club.id IN (:...clubIds)';
        params.clubIds = clubIds;
      }
      return await reservaRepo.createQueryBuilder('reserva')
        .leftJoin('reserva.disponibilidad','disp')
        .leftJoin('disp.cancha','cancha')
        .leftJoin('cancha.club','club')
        .select('club.id','id')
        .addSelect('club.nombre','nombre')
        .addSelect('COUNT(reserva.id)','reservas')
        .where(where, params)
        .groupBy('club.id')
        .orderBy('"reservas"','DESC')
        .getRawMany();
    }

    if (level === 'cancha') {
      if (hasScopedClubs(clubIds)) {
        if (clubId && clubIds!.includes(clubId)) {
          where += ' AND club.id = :clubId';
          params.clubId = clubId;
        } else {
          where += ' AND club.id IN (:...clubIds)';
          params.clubIds = clubIds;
        }
      } else if (clubId) {
        where += ' AND club.id = :clubId';
        params.clubId = clubId;
      }

      return await reservaRepo.createQueryBuilder('reserva')
        .leftJoin('reserva.disponibilidad','disp')
        .leftJoin('disp.cancha','cancha')
        .leftJoin('cancha.club','club')
        .select('cancha.id','id')
        .addSelect('cancha.nombre','nombre')
        .addSelect('COUNT(reserva.id)','reservas')
        .where(where, params)
        .groupBy('cancha.id')
        .orderBy('"reservas"','DESC')
        .getRawMany();
    }

    if (level === 'detalle' && canchaId) {
      params.canchaId = canchaId;
      where += ' AND cancha.id = :canchaId';

      const expr = `date_trunc('day', reserva."fechaHora" AT TIME ZONE :tz)`;
      const rows = await reservaRepo.createQueryBuilder('reserva')
        .leftJoin('reserva.disponibilidad','disp')
        .leftJoin('disp.cancha','cancha')
        .leftJoin('cancha.club','club')
        .select(`${expr}`,'dia')
        .addSelect('COUNT(reserva.id)','reservas')
        .where(where, params)
        .groupBy('dia')
        .orderBy('dia','ASC')
        .getRawMany();

      return rows.map(r => ({
        fecha: new Date(r.dia).toISOString().slice(0,10),
        reservas: Number(r.reservas),
      }));
    }

    throw new Error('Parámetros inválidos para drilldown');
  }

  // ————————————————— OCUPACIÓN (POR CLUB / CANCHA) —————————————————

  async ocupacion({ by='cancha', from, to, tz = 'America/Argentina/Cordoba', clubIds }: Range) {
    const params: any = { tz, from: from ?? null, to: to ?? null };

    // admin-club sin clubes → nada
    if (clubIds && clubIds.length === 0) return [];

    const filterClub =
      hasScopedClubs(clubIds)
        ? ' AND cl.id = ANY(:clubIds)'
        : '';

    const sql = `
      WITH rango AS (
        SELECT generate_series(
          (COALESCE(:from::timestamptz, NOW() - interval '30 day'))::date,
          (COALESCE(:to::timestamptz,   NOW()))::date,
          interval '1 day'
        )::date AS d
      ),
      disp AS (
        SELECT dh.id, dh."diaSemana", dh."horaInicio", dh."horaFin",
               c.id AS cancha_id, c.nombre AS cancha_nombre,
               cl.id AS club_id, cl.nombre AS club_nombre
        FROM "disponibilidad_horario" dh
        JOIN "cancha" c ON c.id = dh."canchaId"
        JOIN "club" cl ON cl.id = c."clubId"
        WHERE dh.disponible = true
        ${filterClub}
      ),
      slots AS (
        SELECT 
          (r.d + dh."horaInicio"::time) AT TIME ZONE :tz AS slot_ts,
          dh.id AS disp_id,
          dh.cancha_id, dh.cancha_nombre, dh.club_id, dh.club_nombre,
          r.d
        FROM rango r
        JOIN disp dh ON EXTRACT(DOW FROM r.d) = dh."diaSemana"
      ),
      reservas AS (
        SELECT 
          d.id AS disp_id, r."fechaHora" AT TIME ZONE :tz AS res_ts,
          r.estado
        FROM "reserva" r
        JOIN "disponibilidad_horario" d ON d.id = r."disponibilidadId"
      )
      SELECT 
        ${by === 'club'
          ? 's.club_id AS id, s.club_nombre AS nombre'
          : 's.cancha_id AS id, s.cancha_nombre AS nombre'},
        COUNT(*) AS slots,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM reservas rr 
          WHERE rr.disp_id = s.disp_id 
            AND date_trunc('hour', rr.res_ts) = date_trunc('hour', s.slot_ts) 
            AND rr.estado = 'confirmada'
        ) THEN 1 ELSE 0 END) AS reservas
      FROM slots s
      GROUP BY 1,2
      ORDER BY reservas DESC;
    `;

    if (hasScopedClubs(clubIds)) {
      (params as any).clubIds = clubIds;
    }

    const rows = await AppDataSource.query(sql, params);
    return rows.map((r: any) => {
      const ocup = r.slots > 0 ? Number(r.reservas)/Number(r.slots) : 0;
      const semaforo = ocup >= 0.8 ? 'verde' : ocup >= 0.5 ? 'amarillo' : 'rojo';
      return {
        id: r.id,
        nombre: r.nombre,
        slots: Number(r.slots),
        reservas: Number(r.reservas),
        ocupacion: ocup,
        semaforo,
      };
    });
  }

  // ————————————————— HEATMAP —————————————————

  async heatmap({ clubId, canchaId, from, to, tz = 'America/Argentina/Cordoba', clubIds }: Range) {
    const params: any = { tz };
    let where = '1=1';
    if (from) { where += ` AND (r."fechaHora" AT TIME ZONE :tz) >= :from`; params.from = from; }
    if (to)   { where += ` AND (r."fechaHora" AT TIME ZONE :tz) <  :to`;   params.to   = to; }

    if (hasScopedClubs(clubIds)) {
      if (clubId && clubIds!.includes(clubId)) {
        where += ' AND cl.id = :clubId';
        params.clubId = clubId;
      } else {
        where += ' AND cl.id IN (:...clubIds)';
        params.clubIds = clubIds;
      }
    } else if (clubId) {
      where += ' AND cl.id = :clubId';
      params.clubId = clubId;
    }

    if (canchaId) {
      where += ' AND c.id = :canchaId';
      params.canchaId = canchaId;
    }

    const rows = await reservaRepo.createQueryBuilder('r')
      .leftJoin('r.disponibilidad','d')
      .leftJoin('d.cancha','c')
      .leftJoin('c.club','cl')
      .select(`EXTRACT(DOW FROM (r."fechaHora" AT TIME ZONE :tz))`,'dow')
      .addSelect(`to_char((r."fechaHora" AT TIME ZONE :tz),'HH24:MI')`,'hora')
      .addSelect('COUNT(r.id)','reservas')
      .where(where, params)
      .groupBy('dow')
      .addGroupBy('hora')
      .orderBy('dow','ASC')
      .addOrderBy('hora','ASC')
      .getRawMany();

    return rows.map(r => ({
      dow: Number(r.dow),
      hora: r.hora,
      reservas: Number(r.reservas),
    }));
  }

  // ————————————————— TENDENCIA OCUPACIÓN —————————————————

  async ocupacionTrend({
    from,
    to,
    tz = 'America/Argentina/Cordoba',
    granularity = 'day',
    clubId,
    canchaId,
    clubIds,
  }: Range) {
    const g = ['day','week','month'].includes(granularity || '') ? granularity : 'day';
    const params: any = { tz, from: from ?? null, to: to ?? null };

    const filterClubDisp = (() => {
      if (hasScopedClubs(clubIds)) {
        if (clubId && clubIds!.includes(clubId)) {
          params.clubId = clubId;
          return ' AND cl.id = :clubId';
        }
        params.clubIds = clubIds;
        return ' AND cl.id = ANY(:clubIds)';
      } else if (clubId) {
        params.clubId = clubId;
        return ' AND cl.id = :clubId';
      }
      return '';
    })();

    const filterCanchaDisp = (() => {
      if (canchaId) {
        params.canchaId = canchaId;
        return ' AND c.id = :canchaId';
      }
      return '';
    })();

    const sql = `
      WITH rango AS (
        SELECT generate_series(
          (COALESCE(:from::timestamptz, NOW() - interval '30 day'))::date,
          (COALESCE(:to::timestamptz,   NOW()))::date,
          interval '1 day'
        )::date AS d
      ),
      disp AS (
        SELECT dh.id, dh."diaSemana", dh."horaInicio", dh."horaFin",
               c.id AS cancha_id,
               cl.id AS club_id
        FROM "disponibilidad_horario" dh
        JOIN "cancha" c ON c.id = dh."canchaId"
        JOIN "club" cl ON cl.id = c."clubId"
        WHERE dh.disponible = true
        ${filterClubDisp}
        ${filterCanchaDisp}
      ),
      slots AS (
        SELECT 
          (r.d + dh."horaInicio"::time) AT TIME ZONE :tz AS slot_ts,
          dh.id AS disp_id
        FROM rango r
        JOIN disp dh ON EXTRACT(DOW FROM r.d) = dh."diaSemana"
      ),
      reservas AS (
        SELECT 
          d.id AS disp_id,
          r."fechaHora" AT TIME ZONE :tz AS res_ts,
          r.estado
        FROM "reserva" r
        JOIN "disponibilidad_horario" d ON d.id = r."disponibilidadId"
      )
      SELECT 
        date_trunc('${g}', s.slot_ts) AS bucket,
        COUNT(*) AS slots,
        SUM(
          CASE WHEN EXISTS (
            SELECT 1 
            FROM reservas rr
            WHERE rr.disp_id = s.disp_id
              AND date_trunc('hour', rr.res_ts) = date_trunc('hour', s.slot_ts)
              AND rr.estado = 'confirmada'
          )
          THEN 1 ELSE 0 END
        ) AS reservas
      FROM slots s
      GROUP BY bucket
      ORDER BY bucket ASC;
    `;

    const rows = await AppDataSource.query(sql, params);
    return rows.map((r: any) => {
      const slots = Number(r.slots);
      const reservas = Number(r.reservas);
      const ocup = slots > 0 ? reservas / slots : 0;
      return {
        bucket: new Date(r.bucket).toISOString(),
        slots,
        reservas,
        ocupacion: ocup,
      };
    });
  }

  // ————————————————— TENDENCIA REVENUE —————————————————

  async revenueTrend({
    from,
    to,
    tz = 'America/Argentina/Cordoba',
    granularity,
    clubId,
    canchaId,
    clubIds,
  }: Range) {
    const g = granularity || 'day';
    const expr = `date_trunc('${g}', reserva."fechaHora" AT TIME ZONE :tz)`;
    const params: any = { tz };
    let where = `reserva.estado = 'confirmada'`;
    if (from) { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) >= :from`; params.from = from; }
    if (to)   { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) <  :to`;   params.to   = to; }

    if (hasScopedClubs(clubIds)) {
      if (canchaId) {
        where += ' AND cancha.id = :canchaId';
        params.canchaId = canchaId;
      } else if (clubId && clubIds!.includes(clubId)) {
        where += ' AND club.id = :clubId';
        params.clubId = clubId;
      } else {
        where += ' AND club.id IN (:...clubIds)';
        params.clubIds = clubIds;
      }
    } else {
      if (clubId)   { where += ' AND club.id = :clubId'; params.clubId = clubId; }
      if (canchaId) { where += ' AND cancha.id = :canchaId'; params.canchaId = canchaId; }
    }

    const rows = await reservaRepo.createQueryBuilder('reserva')
      .leftJoin('reserva.disponibilidad','disp')
      .leftJoin('disp.cancha','cancha')
      .leftJoin('cancha.club','club')
      .select(`${expr}`,'bucket')
      .addSelect('COUNT(reserva.id)','reservasConfirmadas')
      .addSelect(`COALESCE(SUM(cancha."precioPorHora"),0)`,'revenue')
      .where(where, params)
      .groupBy('bucket')
      .orderBy('bucket','ASC')
      .getRawMany();

    return rows.map(r => ({
      bucket: new Date(r.bucket).toISOString(),
      reservasConfirmadas: Number(r.reservasconfirmadas ?? r.reservasConfirmadas),
      revenue: Number(r.revenue),
    }));
  }

  // ————————————————— TENDENCIA USUARIOS —————————————————
  // (por ahora global; si más adelante tenemos "usuario ↔ club" explícito,
  // acá se puede filtrar también)

  async usuariosTrend({
    from,
    to,
    tz = 'America/Argentina/Cordoba',
    granularity,
  }: Range) {
    const g = granularity || 'day';
    const expr = `date_trunc('${g}', usuario."createdAt" AT TIME ZONE :tz)`;
    const params: any = { tz };
    let where = '1=1';
    if (from) { where += ` AND (usuario."createdAt" AT TIME ZONE :tz) >= :from`; params.from = from; }
    if (to)   { where += ` AND (usuario."createdAt" AT TIME ZONE :tz) <  :to`;   params.to   = to; }

    const rows = await usuarioRepo.createQueryBuilder('usuario')
      .select(`${expr}`,'bucket')
      .addSelect('COUNT(usuario.id)','usuariosNuevos')
      .where(where, params)
      .groupBy('bucket')
      .orderBy('bucket','ASC')
      .getRawMany();

    let acumulado = 0;
    return rows.map(r => {
      const count = Number(r.usuariosnuevos ?? r.usuariosNuevos);
      acumulado += count;
      return {
        bucket: new Date(r.bucket).toISOString(),
        usuariosNuevos: count,
        acumulado,
      };
    });
  }

  // ————————————————— SEGMENTACIÓN USUARIOS (RFM) —————————————————

  async segmentacionUsuarios({ clubIds }: Scope = {}) {
    // admin-club sin clubes → vacío
    if (clubIds && clubIds.length === 0) return [];

    const params: any = {};
    const filtroClub = hasScopedClubs(clubIds)
      ? 'WHERE cl.id = ANY(:clubIds)'
      : '';

    if (hasScopedClubs(clubIds)) {
      params.clubIds = clubIds;
    }

    const sql = `
      SELECT 
        u.id AS "usuarioId",
        p.id AS "personaId",
        p.nombre,
        p.apellido,
        p.email,
        MAX(CASE WHEN r.estado = 'confirmada' THEN r."fechaHora" END) AS "lastReserva",
        COUNT(CASE WHEN r.estado = 'confirmada' THEN 1 END) AS "reservasConfirmadas",
        COALESCE(SUM(CASE WHEN r.estado = 'confirmada' THEN c."precioPorHora"::numeric END),0) AS "monetary"
      FROM "usuario" u
      JOIN "persona" p ON p.id = u."personaId"
      LEFT JOIN "reserva" r ON r."personaId" = p.id
      LEFT JOIN "disponibilidad_horario" d ON d.id = r."disponibilidadId"
      LEFT JOIN "cancha" c ON c.id = d."canchaId"
      LEFT JOIN "club" cl ON cl.id = c."clubId"
      ${filtroClub}
      GROUP BY u.id, p.id, p.nombre, p.apellido, p.email
      ORDER BY "monetary" DESC;
    `;

    const rows: any[] = await AppDataSource.query(sql, params);
    const now = DateTime.now().setZone('America/Argentina/Cordoba');

    return rows.map(r => {
      const last = r.lastReserva ? DateTime.fromISO(r.lastReserva as string) : null;
      const recencyDays = last ? Math.max(0, Math.floor(now.diff(last, 'days').days)) : null;
      const frequency = Number(r.reservasConfirmadas || 0);
      const monetary = Number(r.monetary || 0);

      let segment = 'lead'; // nunca reservó
      if (frequency === 0 && recencyDays === null) {
        segment = 'lead';
      } else if (frequency >= 10 && recencyDays !== null && recencyDays <= 30) {
        segment = 'vip';
      } else if (frequency >= 5 && recencyDays !== null && recencyDays <= 60) {
        segment = 'fiel';
      } else if (frequency >= 1 && recencyDays !== null && recencyDays <= 90) {
        segment = 'activo';
      } else if (frequency >= 1 && recencyDays !== null && recencyDays > 90) {
        segment = 'reactivar';
      }

      return {
        usuarioId: r.usuarioId,
        personaId: r.personaId,
        nombreCompleto: `${r.nombre} ${r.apellido}`,
        email: r.email,
        recencyDays,
        lastReserva: r.lastReserva,
        frequency,
        monetary,
        segment,
      };
    });
  }
}

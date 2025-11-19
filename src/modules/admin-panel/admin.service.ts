import { AppDataSource } from '../../database/data-source';
import { Reserva } from '../../entities/Reserva.entity';
import { DisponibilidadHorario } from '../../entities/DisponibilidadHorario.entity';
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
};

export class AdminService {
  // ——— EXISTENTES ———
  async obtenerResumenGeneral() {
    const totalUsuarios = await usuarioRepo.count();
    const totalReservas = await reservaRepo.count();
    const totalCanchas  = await canchaRepo.count();
    const { total } = await deudaRepo.createQueryBuilder('d')
      .select('COALESCE(SUM(d.monto),0)','total')
      .where('d.pagada = false')
      .getRawOne();
    return { totalUsuarios, totalReservas, totalCanchas, deudaTotalPendiente: Number(total) };
  }

  async obtenerTopJugadores({ from, to, tz }: Range = {}) {
    // Mantengo tu ranking pero filtro por rango si viene
    // (si tu ranking depende de otro origen, dejalo igual y omití filtros)
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

  async obtenerCanchasMasUsadas({ from, to, tz = 'America/Argentina/Cordoba', clubId }: Range = {}) {
    // Conteo de reservas por cancha con rango y club opcional
    const params: any = { tz };
    let where = '1=1';
    if (from) { where += ' AND (reserva."fechaHora" AT TIME ZONE :tz) >= :from'; params.from = from; }
    if (to)   { where += ' AND (reserva."fechaHora" AT TIME ZONE :tz) <  :to';   params.to   = to; }
    if (clubId) { where += ' AND club.id = :clubId'; params.clubId = clubId; }

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

  async obtenerPersonasConDeuda() {
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

  // ——— EXISTENTES REPORTES ———
  private bucketExpr(granularity: Range['granularity'], tz: string) {
    const g = granularity || 'day';
    const expr = `date_trunc('${g}', reserva."fechaHora" AT TIME ZONE :tz)`;
    return { g, expr };
  }

  async reservasAggregate({ from, to, tz = 'America/Argentina/Cordoba', granularity, clubId, canchaId, estado }: Range) {
    const { expr } = this.bucketExpr(granularity, tz);
    const params: any = { tz };
    let where = '1=1';
    if (from) { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) >= :from`; params.from = from; }
    if (to)   { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) <  :to`;   params.to   = to; }
    if (clubId) { where += ' AND club.id = :clubId'; params.clubId = clubId; }
    if (canchaId) { where += ' AND cancha.id = :canchaId'; params.canchaId = canchaId; }
    if (estado) { where += ' AND reserva.estado = :estado'; params.estado = estado; }

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

  async reservasDrilldown({ level = 'club', clubId, canchaId, from, to, tz = 'America/Argentina/Cordoba', estado }: Range) {
    const params: any = { tz };
    let where = '1=1';
    if (from) { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) >= :from`; params.from = from; }
    if (to)   { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) <  :to`;   params.to   = to; }
    if (estado) { where += ' AND reserva.estado = :estado'; params.estado = estado; }

    if (level === 'club') {
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

    if (level === 'cancha' && clubId) {
      params.clubId = clubId;
      where += ' AND club.id = :clubId';
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
      // Detalle día → cantidad (podés devolver reservas individuales si preferís)
      const expr = `date_trunc('day', reserva."fechaHora" AT TIME ZONE :tz)`;
      const rows = await reservaRepo.createQueryBuilder('reserva')
        .leftJoin('reserva.disponibilidad','disp')
        .leftJoin('disp.cancha','cancha')
        .select(`${expr}`,'dia')
        .addSelect('COUNT(reserva.id)','reservas')
        .where(where, params)
        .groupBy('dia')
        .orderBy('dia','ASC')
        .getRawMany();

      return rows.map(r => ({ fecha: new Date(r.dia).toISOString().slice(0,10), reservas: Number(r.reservas) }));
    }

    throw new Error('Parámetros inválidos para drilldown');
  }

  async ocupacion({ by='cancha', from, to, tz = 'America/Argentina/Cordoba' }: Range) {
    // Ocupación = reservas_confirmadas / slots_disponibles_en_rango
    const params: any = { tz };
    let rango = '1=1';
    if (from) { rango += ` AND d IS NOT NULL AND d >= :from`; params.from = from; }
    if (to)   { rango += ` AND d IS NOT NULL AND d <  :to`;   params.to   = to; }

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
        ${by === 'club' ? 's.club_id AS id, s.club_nombre AS nombre' : 's.cancha_id AS id, s.cancha_nombre AS nombre'},
        COUNT(*) AS slots,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM reservas rr 
          WHERE rr.disp_id = s.disp_id 
            AND date_trunc('hour', rr.res_ts) = date_trunc('hour', s.slot_ts) 
            AND rr.estado = 'confirmada'
        ) THEN 1 ELSE 0 END) AS reservas
      FROM slots s
      WHERE ${rango}
      GROUP BY 1,2
      ORDER BY reservas DESC;
    `;

    const rows = await AppDataSource.query(sql, params);
    return rows.map((r: any) => {
      const ocup = r.slots > 0 ? Number(r.reservas)/Number(r.slots) : 0;
      const semaforo = ocup >= 0.8 ? 'verde' : ocup >= 0.5 ? 'amarillo' : 'rojo';
      return { id: r.id, nombre: r.nombre, slots: Number(r.slots), reservas: Number(r.reservas), ocupacion: ocup, semaforo };
    });
  }

  async heatmap({ clubId, canchaId, from, to, tz = 'America/Argentina/Cordoba' }: Range) {
    const params: any = { tz };
    let where = '1=1';
    if (from) { where += ` AND (r."fechaHora" AT TIME ZONE :tz) >= :from`; params.from = from; }
    if (to)   { where += ` AND (r."fechaHora" AT TIME ZONE :tz) <  :to`;   params.to   = to; }
    if (clubId) { where += ' AND cl.id = :clubId'; params.clubId = clubId; }
    if (canchaId) { where += ' AND c.id = :canchaId'; params.canchaId = canchaId; }

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

    return rows.map(r => ({ dow: Number(r.dow), hora: r.hora, reservas: Number(r.reservas) }));
  }

  // ——— NUEVOS: TENDENCIAS PARA DASHBOARD ———

  async ocupacionTrend({
    from,
    to,
    tz = 'America/Argentina/Cordoba',
    granularity = 'day',
    clubId,
    canchaId,
  }: Range) {
    const g = ['day','week','month'].includes(granularity || '') ? granularity : 'day';
    const params: any = { tz };
    if (from) params.from = from;
    if (to) params.to = to;
    if (clubId) params.clubId = clubId;
    if (canchaId) params.canchaId = canchaId;

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
          ${clubId ? 'AND cl.id = :clubId' : ''}
          ${canchaId ? 'AND c.id = :canchaId' : ''}
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

  async revenueTrend({
    from,
    to,
    tz = 'America/Argentina/Cordoba',
    granularity,
    clubId,
    canchaId,
  }: Range) {
    const g = granularity || 'day';
    const expr = `date_trunc('${g}', reserva."fechaHora" AT TIME ZONE :tz)`;
    const params: any = { tz };
    let where = 'reserva.estado = \'confirmada\'';
    if (from) { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) >= :from`; params.from = from; }
    if (to)   { where += ` AND (reserva."fechaHora" AT TIME ZONE :tz) <  :to`;   params.to   = to; }
    if (clubId)   { where += ' AND club.id = :clubId'; params.clubId = clubId; }
    if (canchaId) { where += ' AND cancha.id = :canchaId'; params.canchaId = canchaId; }

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

    // acumulado para gráfico de línea
    let acumulado = 0;
    const out = rows.map(r => {
      const count = Number(r.usuariosnuevos ?? r.usuariosNuevos);
      acumulado += count;
      return {
        bucket: new Date(r.bucket).toISOString(),
        usuariosNuevos: count,
        acumulado,
      };
    });

    return out;
  }

  // ——— NUEVO: Segmentación de usuarios (RFM simple) ———
  async segmentacionUsuarios() {
    // Tomamos reservas confirmadas y precio de cancha como "Monetary"
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
      GROUP BY u.id, p.id, p.nombre, p.apellido, p.email
      ORDER BY "monetary" DESC;
    `;

    const rows: any[] = await AppDataSource.query(sql);
    const now = DateTime.now().setZone('America/Argentina/Cordoba');

    const mapped = rows.map(r => {
      const last = r.lastReserva ? DateTime.fromISO(r.lastReserva as string) : null;
      const recencyDays = last ? Math.max(0, Math.floor(now.diff(last, 'days').days)) : null;
      const frequency = Number(r.reservasConfirmadas || 0);
      const monetary = Number(r.monetary || 0);

      // Segmentación simple
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

    return mapped;
  }
}

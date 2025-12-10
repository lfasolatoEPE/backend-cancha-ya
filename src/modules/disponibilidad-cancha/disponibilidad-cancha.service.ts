import { AppDataSource } from '../../database/data-source';
import { DisponibilidadHorario } from '../../entities/DisponibilidadHorario.entity';
import { Cancha } from '../../entities/Cancha.entity';
import { Horario } from '../../entities/Horario.entity';
import { In } from 'typeorm';

const disponibilidadRepo = AppDataSource.getRepository(DisponibilidadHorario);
const canchaRepo = AppDataSource.getRepository(Cancha);
const horarioRepo = AppDataSource.getRepository(Horario);

type CrearLote = {
  canchaIds: string[];
  horarioIds: string[];
  diasSemana: number[]; // 0..6 (0=dom)
  disponible?: boolean;
};

type AvailabilityQuery = {
  from: string;
  to: string;
  clubId?: string;
  canchaId?: string;
};

function hasScopedClubs(clubIds?: string[]) {
  return Array.isArray(clubIds) && clubIds.length > 0;
}

export class DisponibilidadCanchaService {
  // Alta masiva de patrón semanal
  async crearLote(
    { canchaIds, horarioIds, diasSemana, disponible = true }: CrearLote,
    scopeClubIds?: string[]
  ) {
    if (!canchaIds?.length || !horarioIds?.length || !diasSemana?.length) {
      throw new Error('Debes enviar al menos una canchaId, un horarioId y un diaSemana');
    }

    if (scopeClubIds && scopeClubIds.length === 0) {
      throw new Error('No tenés clubes asignados para gestionar disponibilidades');
    }

    const [canchas, horarios] = await Promise.all([
      canchaRepo.find({
        where: { id: In(canchaIds) },
        relations: ['club'], // ⬅️ importante para validar club
      }),
      horarioRepo.find({ where: { id: In(horarioIds) } }),
    ]);

    if (canchas.length !== canchaIds.length) {
      const missing = canchaIds.filter(id => !canchas.find(c => c.id === id));
      throw new Error(`Cancha(s) no encontrada(s): ${missing.join(', ')}`);
    }
    if (horarios.length !== horarioIds.length) {
      const missing = horarioIds.filter(id => !horarios.find(h => h.id === id));
      throw new Error(`Horario(s) no encontrado(s): ${missing.join(', ')}`);
    }

    // 🔐 Si es admin-club, validar que todas las canchas pertenezcan a sus clubes
    if (hasScopedClubs(scopeClubIds)) {
      const fueraDeScope = canchas.filter(
        c => !scopeClubIds!.includes(c.club.id)
      );
      if (fueraDeScope.length) {
        const nombres = fueraDeScope.map(c => c.nombre).join(', ');
        throw new Error(`No puedes gestionar disponibilidades de canchas fuera de tus clubes: ${nombres}`);
      }
    }

    const existentes = await disponibilidadRepo.find({
      where: {
        cancha: { id: In(canchaIds) },
        horario: { id: In(horarioIds) },
        diaSemana: In(diasSemana),
      },
      relations: ['cancha', 'horario'],
    });

    const existingKey = new Set(
      existentes.map(e => `${e.cancha.id}|${e.horario.id}|${e.diaSemana}`)
    );

    const canchaMap = new Map(canchas.map(c => [c.id, c]));
    const horarioMap = new Map(horarios.map(h => [h.id, h]));

    const aCrear: DisponibilidadHorario[] = [];
    for (const canchaId of canchaIds) {
      for (const horarioId of horarioIds) {
        for (const dia of diasSemana) {
          const key = `${canchaId}|${horarioId}|${dia}`;
          if (existingKey.has(key)) continue;

          const ent = disponibilidadRepo.create({
            cancha: canchaMap.get(canchaId)!,
            horario: horarioMap.get(horarioId)!,
            diaSemana: dia,
            disponible,
          });
          aCrear.push(ent);
        }
      }
    }

    if (aCrear.length === 0) {
      return {
        inserted: 0,
        skipped: existentes.length,
        message: 'No hay combinaciones nuevas (todas ya existen).',
      };
    }

    const creadas = await AppDataSource.manager.transaction(async (trx) => {
      return await trx.save(DisponibilidadHorario, aCrear, { chunk: 100 });
    });

    return {
      inserted: creadas.length,
      skipped: existentes.length,
      totalPost: creadas.length + existentes.length,
      created: creadas.map(d => ({
        id: d.id,
        canchaId: d.cancha.id,
        horarioId: d.horario.id,
        diaSemana: d.diaSemana,
        disponible: d.disponible,
      })),
    };
  }

  // Disponibilidad por rango (on-the-fly, performante)
  async disponibilidadRango(
    { from, to, clubId, canchaId }: AvailabilityQuery,
    scopeClubIds?: string[]
  ) {
    const params: any = {
      from,
      to,
      clubId: clubId ?? null,
      canchaId: canchaId ?? null,
    };

    let extraFilter = '';
    if (hasScopedClubs(scopeClubIds)) {
      extraFilter = ' AND c."clubId" = ANY(:scopeClubIds)';
      params.scopeClubIds = scopeClubIds;
    }

    const sql = `
      WITH dias AS (
        SELECT gs::date AS d
        FROM generate_series(:from::date, :to::date, interval '1 day') gs
      ),
      slots_base AS (
        SELECT 
          c.id AS "canchaId",
          c.nombre AS "canchaNombre",
          h.id AS "horarioId",
          h."horaInicio",
          h."horaFin",
          dh.id AS "disponibilidadId",
          d.d   AS fecha
        FROM dias d
        JOIN "disponibilidad_horario" dh
          ON dh.disponible = true
         AND dh."diaSemana" = EXTRACT(DOW FROM d.d)::int
        JOIN "cancha" c ON c.id = dh."canchaId"
        JOIN "horario" h ON h.id = dh."horarioId"
        WHERE (:clubId IS NULL OR c."clubId" = :clubId)
          AND (:canchaId IS NULL OR c.id = :canchaId)
          ${extraFilter}
      ),
      ocupados AS (
        SELECT r."disponibilidadId", date_trunc('day', r."fechaHora")::date AS fecha
        FROM "reserva" r
        WHERE r.estado IN ('pendiente','confirmada')
      )
      SELECT 
        sb."canchaId",
        sb."canchaNombre",
        sb."horarioId",
        sb."horaInicio",
        sb."horaFin",
        sb."disponibilidadId",
        sb.fecha::text AS fecha,
        (o."disponibilidadId" IS NOT NULL) AS ocupado
      FROM slots_base sb
      LEFT JOIN ocupados o
        ON o."disponibilidadId" = sb."disponibilidadId"
       AND o.fecha = sb.fecha
      ORDER BY sb.fecha, sb."horaInicio", sb."canchaNombre";
    `;

    const rows = await AppDataSource.query(sql, params);

    return rows.map((r: any) => {
      const ocupado =
        r.ocupado === true || r.ocupado === 't' || r.ocupado === 1;

      return {
        fecha: r.fecha,                 // 'YYYY-MM-DD'
        canchaId: r.canchaId,
        canchaNombre: r.canchaNombre,
        horarioId: r.horarioId,
        horaInicio: r.horaInicio,       // 'HH:MM:SS'
        horaFin: r.horaFin,
        disponibilidadId: r.disponibilidadId,
        ocupado,
        estado: ocupado ? 'ocupado' : 'libre',
      };
    });
  }


  async listarPorCancha(canchaId: string, scopeClubIds?: string[]) {
    // si es admin-club, validar que la cancha esté dentro de sus clubes
    if (hasScopedClubs(scopeClubIds)) {
      const cancha = await canchaRepo.findOne({
        where: { id: canchaId },
        relations: ['club'],
      });
      if (!cancha) throw new Error('Cancha no encontrada');
      if (!scopeClubIds!.includes(cancha.club.id)) {
        throw new Error('No puedes ver disponibilidades de canchas fuera de tus clubes');
      }
    }

    return await disponibilidadRepo.find({
      where: { cancha: { id: canchaId } },
      relations: ['horario'],
      order: { diaSemana: 'ASC' },
    });
  }

  async eliminar(id: string, scopeClubIds?: string[]) {
    const disponibilidad = await disponibilidadRepo.findOne({
      where: { id },
      relations: ['cancha', 'cancha.club'],
    });
    if (!disponibilidad) throw new Error('Disponibilidad no encontrada');

    if (hasScopedClubs(scopeClubIds)) {
      if (!scopeClubIds!.includes(disponibilidad.cancha.club.id)) {
        throw new Error('No puedes eliminar disponibilidades de canchas fuera de tus clubes');
      }
    }

    return await disponibilidadRepo.remove(disponibilidad);
  }
}

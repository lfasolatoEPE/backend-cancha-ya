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

export class DisponibilidadCanchaService {
  // Alta masiva de patrón semanal (se mantiene tal cual)
  async crearLote({ canchaIds, horarioIds, diasSemana, disponible = true }: CrearLote) {
    if (!canchaIds?.length || !horarioIds?.length || !diasSemana?.length) {
      throw new Error('Debes enviar al menos una canchaId, un horarioId y un diaSemana');
    }

    const [canchas, horarios] = await Promise.all([
      canchaRepo.find({ where: { id: In(canchaIds) } }),
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

  // NUEVO: disponibilidad por rango (on-the-fly, performante)
  async disponibilidadRango({ from, to, clubId, canchaId }: AvailabilityQuery) {
    const params: any = { from, to, clubId: clubId ?? null, canchaId: canchaId ?? null };

    // Nota: Postgres EXTRACT(DOW) → 0=domingo..6=sábado. Tu campo diaSemana ya usa 0=dom en el backend.
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
      ),
      ocupados AS (
        SELECT r."disponibilidadId", date_trunc('day', r."fechaHora")::date AS fecha
        FROM "reserva" r
        WHERE r.estado IN ('pendiente','confirmada')
      )
      SELECT sb."canchaId", sb."canchaNombre", sb."horarioId", sb."horaInicio", sb."horaFin",
             sb."disponibilidadId", sb.fecha::text AS fecha
      FROM slots_base sb
      LEFT JOIN ocupados o
        ON o."disponibilidadId" = sb."disponibilidadId"
       AND o.fecha = sb.fecha
      WHERE o."disponibilidadId" IS NULL
      ORDER BY sb.fecha, sb."horaInicio", sb."canchaNombre";
    `;

    // Devuelve: { fecha, canchaId, canchaNombre, horarioId, horaInicio, horaFin, disponibilidadId }
    return await AppDataSource.query(sql, params);
  }

  // ——— EXISTENTES ———
  async listarPorCancha(canchaId: string) {
    return await disponibilidadRepo.find({
      where: { cancha: { id: canchaId } },
      relations: ['horario'],
      order: { diaSemana: 'ASC' },
    });
  }

  async eliminar(id: string) {
    const disponibilidad = await disponibilidadRepo.findOneBy({ id });
    if (!disponibilidad) throw new Error('Disponibilidad no encontrada');
    return await disponibilidadRepo.remove(disponibilidad);
  }
}

import { AppDataSource } from '../../database/data-source';
import { Reserva } from '../../entities/Reserva.entity';
import { Deuda } from '../../entities/Deuda.entity';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { createObjectCsvStringifier } from 'csv-writer';

const reservaRepo = AppDataSource.getRepository(Reserva);
const deudaRepo = AppDataSource.getRepository(Deuda);
const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);

export class ReporteService {
  async generarCsvReservas(): Promise<Buffer> {
    const reservas = await reservaRepo.find({
      relations: ['persona', 'cancha']
    });

    const csv = createObjectCsvStringifier({
      header: [
        { id: 'fecha', title: 'Fecha' },
        { id: 'hora', title: 'Hora' },
        { id: 'persona', title: 'Persona' },
        { id: 'cancha', title: 'Cancha' },
        { id: 'estado', title: 'Estado' }
      ]
    });

    const rows = reservas.map(r => ({
      fecha: r.fechaHora.toISOString().split('T')[0],
      hora: r.fechaHora.toISOString().split('T')[1].substring(0, 5),
      persona: r.persona?.nombre || 'N/D',
      cancha: r.cancha?.nombre || 'N/D',
      estado: r.estado
    }));

    return Buffer.from(csv.getHeaderString() + csv.stringifyRecords(rows));
  }

  async generarCsvDeudas(): Promise<Buffer> {
    const deudas = await deudaRepo.find({
      where: { pagada: false },
      relations: ['persona']
    });

    const csv = createObjectCsvStringifier({
      header: [
        { id: 'persona', title: 'Persona' },
        { id: 'email', title: 'Email' },
        { id: 'monto', title: 'Monto' },
        { id: 'vencimiento', title: 'Vencimiento' }
      ]
    });

    const rows = deudas.map(d => ({
      persona: d.persona.nombre,
      email: d.persona.email,
      monto: d.monto,
      vencimiento: d.fechaVencimiento
    }));

    return Buffer.from(csv.getHeaderString() + csv.stringifyRecords(rows));
  }

  async generarCsvRankingJugadores(): Promise<Buffer> {
    const perfiles = await perfilRepo.find({
      relations: ['usuario', 'usuario.persona'],
      order: { ranking: 'DESC' },
      take: 100
    });

    const csv = createObjectCsvStringifier({
      header: [
        { id: 'nombre', title: 'Nombre' },
        { id: 'email', title: 'Email' },
        { id: 'ranking', title: 'Ranking' }
      ]
    });

    const rows = perfiles.map(p => ({
      nombre: p.usuario.persona.nombre,
      email: p.usuario.persona.email,
      ranking: p.ranking
    }));

    return Buffer.from(csv.getHeaderString() + csv.stringifyRecords(rows));
  }
}

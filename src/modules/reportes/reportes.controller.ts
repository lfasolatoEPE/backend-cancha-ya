import { Request, Response } from 'express';
import { ReporteService } from './reportes.service';

export class ReporteController {
  constructor(private service: ReporteService) {}

  exportarReservasCsv = async (_req: Request, res: Response) => {
    const buffer = await this.service.generarCsvReservas();
    res.header('Content-Type', 'text/csv');
    res.attachment('reservas.csv');
    res.send(buffer);
  };

  exportarDeudasCsv = async (_req: Request, res: Response) => {
    const buffer = await this.service.generarCsvDeudas();
    res.header('Content-Type', 'text/csv');
    res.attachment('deudas.csv');
    res.send(buffer);
  };

  exportarRankingJugadoresCsv = async (_req: Request, res: Response) => {
    const buffer = await this.service.generarCsvRankingJugadores();
    res.header('Content-Type', 'text/csv');
    res.attachment('ranking-jugadores.csv');
    res.send(buffer);
  };
}

import { Request, Response } from 'express';
import { AdminService } from './admin.service';

export class AdminController {
  constructor(private service: AdminService) {}

  resumenGeneral = async (_req: Request, res: Response) => {
    const resumen = await this.service.obtenerResumenGeneral();
    res.json(resumen);
  };

  topJugadores = async (req: Request, res: Response) => {
    const { from, to, tz } = req.query as any;
    const data = await this.service.obtenerTopJugadores({ from, to, tz });
    res.json(data);
  };

  canchasMasUsadas = async (req: Request, res: Response) => {
    const { from, to, tz, clubId } = req.query as any;
    const data = await this.service.obtenerCanchasMasUsadas({ from, to, tz, clubId });
    res.json(data);
  };

  personasConDeuda = async (_req: Request, res: Response) => {
    const personas = await this.service.obtenerPersonasConDeuda();
    res.json(personas);
  };

  // EXISTENTES
  aggregates = async (req: Request, res: Response) => {
    const data = await this.service.reservasAggregate(req.query as any);
    res.json(data);
  };

  drilldown = async (req: Request, res: Response) => {
    const data = await this.service.reservasDrilldown(req.query as any);
    res.json(data);
  };

  ocupacion = async (req: Request, res: Response) => {
    const data = await this.service.ocupacion(req.query as any);
    res.json(data);
  };

  heatmap = async (req: Request, res: Response) => {
    const data = await this.service.heatmap(req.query as any);
    res.json(data);
  };

  // NUEVO: tendencia de ocupación (time-series)
  ocupacionTrend = async (req: Request, res: Response) => {
    const data = await this.service.ocupacionTrend(req.query as any);
    res.json(data);
  };

  // NUEVO: tendencia de ingresos
  revenueTrend = async (req: Request, res: Response) => {
    const data = await this.service.revenueTrend(req.query as any);
    res.json(data);
  };

  // NUEVO: tendencia de usuarios
  usuariosTrend = async (req: Request, res: Response) => {
    const data = await this.service.usuariosTrend(req.query as any);
    res.json(data);
  };

  // NUEVO: segmentación de usuarios (RFM simple)
  segmentacionUsuarios = async (_req: Request, res: Response) => {
    const data = await this.service.segmentacionUsuarios();
    res.json(data);
  };
}

// src/modules/admin/admin.controller.ts
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

  // NUEVOS
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
}

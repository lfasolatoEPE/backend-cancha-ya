import { Request, Response } from 'express';
import { AdminService } from './admin.service';

export class AdminController {
  constructor(private service: AdminService) {}

  resumenGeneral = async (_req: Request, res: Response) => {
    const resumen = await this.service.obtenerResumenGeneral();
    res.json(resumen);
  };

  topJugadores = async (_req: Request, res: Response) => {
    const top = await this.service.obtenerTopJugadores();
    res.json(top);
  };

  canchasMasUsadas = async (_req: Request, res: Response) => {
    const data = await this.service.obtenerCanchasMasUsadas();
    res.json(data);
  };

  personasConDeuda = async (_req: Request, res: Response) => {
    const personas = await this.service.obtenerPersonasConDeuda();
    res.json(personas);
  };
}

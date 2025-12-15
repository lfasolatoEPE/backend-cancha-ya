import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { NivelAcceso } from '../../entities/Rol.entity';

type JwtUser = {
  id: string;
  rol: string; // nombre del rol (informativo)
  nivelAcceso: NivelAcceso; // <- ESTE MANDA
  personaId: string;
  email: string;
  clubIds?: string[];
};

export class AdminController {
  constructor(private service: AdminService) {}

  /** Obtiene el alcance de clubes según el rol */
  private getScope(req: Request): { clubIds?: string[] } {
    const user = (req as any).user as JwtUser | undefined;
    if (!user) return {};

    if (user.nivelAcceso === NivelAcceso.AdminClub) {
      return { clubIds: user.clubIds ?? [] };
    }

    // admin global
    return {};
  }

  resumenGeneral = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const resumen = await this.service.obtenerResumenGeneral(scope);
    res.json(resumen);
  };

  topJugadores = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const { from, to, tz } = req.query as any;
    const data = await this.service.obtenerTopJugadores({ from, to, tz, ...scope });
    res.json(data);
  };

  canchasMasUsadas = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const { from, to, tz, clubId } = req.query as any;
    const data = await this.service.obtenerCanchasMasUsadas({
      from,
      to,
      tz,
      clubId,
      ...scope,
    });
    res.json(data);
  };

  personasConDeuda = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const personas = await this.service.obtenerPersonasConDeuda(scope);
    res.json(personas);
  };

  // EXISTENTES
  aggregates = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const data = await this.service.reservasAggregate({ ...(req.query as any), ...scope });
    res.json(data);
  };

  drilldown = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const data = await this.service.reservasDrilldown({ ...(req.query as any), ...scope });
    res.json(data);
  };

  ocupacion = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const data = await this.service.ocupacion({ ...(req.query as any), ...scope });
    res.json(data);
  };

  heatmap = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const data = await this.service.heatmap({ ...(req.query as any), ...scope });
    res.json(data);
  };

  // NUEVO: tendencia de ocupación (time-series)
  ocupacionTrend = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const data = await this.service.ocupacionTrend({ ...(req.query as any), ...scope });
    res.json(data);
  };

  // NUEVO: tendencia de ingresos
  revenueTrend = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const data = await this.service.revenueTrend({ ...(req.query as any), ...scope });
    res.json(data);
  };

  // NUEVO: tendencia de usuarios
  usuariosTrend = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const data = await this.service.usuariosTrend({ ...(req.query as any), ...scope });
    res.json(data);
  };

  // NUEVO: segmentación de usuarios (RFM simple)
  segmentacionUsuarios = async (req: Request, res: Response) => {
    const scope = this.getScope(req);
    const data = await this.service.segmentacionUsuarios(scope);
    res.json(data);
  };
}

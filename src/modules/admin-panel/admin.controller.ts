import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { NivelAcceso } from '../../entities/Rol.entity';

type JwtUser = {
  id: string;
  personaId?: string;
  email?: string;

  rol?: string; // informativo
  nivelAcceso?: NivelAcceso; // viene del JWT (desde rol.nivelAcceso)
  clubIds?: string[]; // scope admin-club
};

export class AdminController {
  constructor(private service: AdminService) {}

  /** Obtiene el alcance de clubes según el nivel de acceso del JWT */
  private getScope(req: Request): { clubIds?: string[] } {
    const user = (req as any).user as JwtUser | undefined;
    if (!user) return {};

    if (user.nivelAcceso === NivelAcceso.AdminClub) {
      // si llega vacío => admin-club sin scope (no debería pasar si backend valida)
      return { clubIds: user.clubIds ?? [] };
    }

    // admin global: sin restricción
    return {};
  }

  resumenGeneral = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const resumen = await this.service.obtenerResumenGeneral(scope);
      res.json(resumen);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en resumenGeneral' });
    }
  };

  topJugadores = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const { from, to, tz } = req.query as any;
      const data = await this.service.obtenerTopJugadores({ from, to, tz, ...scope });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en topJugadores' });
    }
  };

  canchasMasUsadas = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const { from, to, tz, clubId } = req.query as any;
      const data = await this.service.obtenerCanchasMasUsadas({ from, to, tz, clubId, ...scope });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en canchasMasUsadas' });
    }
  };

  personasConDeuda = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const personas = await this.service.obtenerPersonasConDeuda(scope);
      res.json(personas);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en personasConDeuda' });
    }
  };

  aggregates = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const data = await this.service.reservasAggregate({ ...(req.query as any), ...scope });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en aggregates' });
    }
  };

  drilldown = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const data = await this.service.reservasDrilldown({ ...(req.query as any), ...scope });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en drilldown' });
    }
  };

  ocupacion = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const data = await this.service.ocupacion({ ...(req.query as any), ...scope });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en ocupacion' });
    }
  };

  heatmap = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const data = await this.service.heatmap({ ...(req.query as any), ...scope });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en heatmap' });
    }
  };

  ocupacionTrend = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const data = await this.service.ocupacionTrend({ ...(req.query as any), ...scope });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en ocupacionTrend' });
    }
  };

  revenueTrend = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const data = await this.service.revenueTrend({ ...(req.query as any), ...scope });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en revenueTrend' });
    }
  };

  usuariosTrend = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const data = await this.service.usuariosTrend({ ...(req.query as any), ...scope });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en usuariosTrend' });
    }
  };

  segmentacionUsuarios = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = this.getScope(req);
      const data = await this.service.segmentacionUsuarios(scope);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Error en segmentacionUsuarios' });
    }
  };
}

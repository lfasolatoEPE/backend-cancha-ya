// src/modules/ranking/ranking.controller.ts
import { Request, Response } from 'express';
import { RankingService } from './ranking.service';

export class RankingController {
  constructor(private service: RankingService) {}

  private getPersonaId(req: Request) {
    return (req as any).user?.personaId as string;
  }

  obtenerRankingGeneral = async (_req: Request, res: Response) => {
    try {
      const ranking = await this.service.rankingGeneral();
      res.json(ranking);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  obtenerPerfilDeUsuario = async (req: Request, res: Response) => {
    try {
      const { usuarioId } = req.params;
      const perfil = await this.service.perfilDeUsuario(usuarioId);
      res.json(perfil);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  // 🔹 NUEVO: ranking/me -> perfil competitivo del logueado
  obtenerMiPerfil = async (req: Request, res: Response) => {
    try {
      const personaId = this.getPersonaId(req);
      if (!personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const perfil = await this.service.perfilDeMiUsuario(personaId);
      res.json(perfil);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };
}

import { Request, Response } from 'express';
import { RankingService } from './ranking.service';

export class RankingController {
  constructor(private service: RankingService) {}

  obtenerRankingGeneral = async (_req: Request, res: Response) => {
    const ranking = await this.service.rankingGeneral();
    res.json(ranking);
  };

  obtenerPerfilDeUsuario = async (req: Request, res: Response) => {
    const { usuarioId } = req.params;
    const perfil = await this.service.perfilDeUsuario(usuarioId);
    res.json(perfil);
  };
}

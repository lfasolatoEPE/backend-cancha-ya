import { Request, Response } from 'express';
import { listarRankingJugadores } from '../services/competicion.service';

export const listarRankingJugadoresHandler = async (req: Request, res: Response) => {
  const { deporteId } = req.query;

  const ranking = await listarRankingJugadores(deporteId as string | undefined);

  res.json(ranking);
};

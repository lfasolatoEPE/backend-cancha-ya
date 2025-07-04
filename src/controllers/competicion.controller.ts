import { Request, Response } from 'express';
import { listarRankingJugadores, listarRankingEquipos } from '../services/competicion.service';

export const rankingJugadoresHandler = async (req: Request, res: Response) => {
  const { deporteId } = req.query;

  const ranking = await listarRankingJugadores(deporteId as string | undefined);

  res.json(ranking);
};

export const rankingEquiposHandler = async (
  req: Request,
  res: Response
) => {
  const { deporteId } = req.query;

  const lista = await listarRankingEquipos(
    deporteId ? (deporteId as string) : undefined
  );

  res.json(lista);
};

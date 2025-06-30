import { Request, Response } from 'express';
import { crearClub, listarClubes, obtenerClubPorId, actualizarClub, eliminarClub } from '../services/club.service';

export const crearClubHandler = async (req: Request, res: Response) => {
  const club = await crearClub(req.body);
  res.status(201).json(club);
};

export const listarClubesHandler = async (_req: Request, res: Response) => {
  const clubes = await listarClubes();
  res.json(clubes);
};

export const obtenerClubHandler = async (req: Request, res: Response) => {
  const club = await obtenerClubPorId(req.params.id);
  res.json(club);
};

export const actualizarClubHandler = async (req: Request, res: Response) => {
  const club = await actualizarClub(req.params.id, req.body);
  res.json(club);
};

export const eliminarClubHandler = async (req: Request, res: Response) => {
  await eliminarClub(req.params.id);
  res.json({ mensaje: 'Club eliminado' });
};

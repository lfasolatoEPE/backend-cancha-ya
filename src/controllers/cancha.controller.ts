import { Request, Response } from 'express';
import { crearCancha, listarCanchas, obtenerCanchaPorId, actualizarCancha, eliminarCancha } from '../services/cancha.service';

export const crearCanchaHandler = async (req: Request, res: Response) => {
  const cancha = await crearCancha(req.body);
  res.status(201).json(cancha);
};

export const listarCanchasHandler = async (_req: Request, res: Response) => {
  const canchas = await listarCanchas();
  res.json(canchas);
};

export const obtenerCanchaHandler = async (req: Request, res: Response) => {
  const cancha = await obtenerCanchaPorId(req.params.id);
  res.json(cancha);
};

export const actualizarCanchaHandler = async (req: Request, res: Response) => {
  const cancha = await actualizarCancha(req.params.id, req.body);
  res.json(cancha);
};

export const eliminarCanchaHandler = async (req: Request, res: Response) => {
  await eliminarCancha(req.params.id);
  res.json({ mensaje: 'Cancha eliminada' });
};

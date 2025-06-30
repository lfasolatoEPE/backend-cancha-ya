import { Request, Response } from 'express';
import { crearDeporte, listarDeportes, obtenerDeportePorId, actualizarDeporte, eliminarDeporte } from '../services/deporte.service';

export const crearDeporteHandler = async (req: Request, res: Response) => {
  const deporte = await crearDeporte(req.body);
  res.status(201).json(deporte);
};

export const listarDeportesHandler = async (_req: Request, res: Response) => {
  const deportes = await listarDeportes();
  res.json(deportes);
};

export const obtenerDeporteHandler = async (req: Request, res: Response) => {
  const deporte = await obtenerDeportePorId(req.params.id);
  res.json(deporte);
};

export const actualizarDeporteHandler = async (req: Request, res: Response) => {
  const deporte = await actualizarDeporte(req.params.id, req.body);
  res.json(deporte);
};

export const eliminarDeporteHandler = async (req: Request, res: Response) => {
  await eliminarDeporte(req.params.id);
  res.json({ mensaje: 'Deporte eliminado' });
};

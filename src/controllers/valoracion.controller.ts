import { Request, Response } from 'express';
import { crearValoracion, listarValoraciones, obtenerValoracionPorId, eliminarValoracion } from '../services/valoracion.service';

export const crearValoracionHandler = async (req: Request, res: Response) => {
  const valoracion = await crearValoracion(req.body);
  res.status(201).json(valoracion);
};

export const listarValoracionesHandler = async (_req: Request, res: Response) => {
  const valoraciones = await listarValoraciones();
  res.json(valoraciones);
};

export const obtenerValoracionHandler = async (req: Request, res: Response) => {
  const valoracion = await obtenerValoracionPorId(req.params.id);
  res.json(valoracion);
};

export const eliminarValoracionHandler = async (req: Request, res: Response) => {
  await eliminarValoracion(req.params.id);
  res.json({ mensaje: 'Valoración eliminada' });
};

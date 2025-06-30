import { Request, Response } from 'express';
import { crearDeuda, listarDeudas, obtenerDeudaPorId, actualizarDeuda, eliminarDeuda } from '../services/deuda.service';

export const crearDeudaHandler = async (req: Request, res: Response) => {
  const deuda = await crearDeuda(req.body);
  res.status(201).json(deuda);
};

export const listarDeudasHandler = async (_req: Request, res: Response) => {
  const deudas = await listarDeudas();
  res.json(deudas);
};

export const obtenerDeudaHandler = async (req: Request, res: Response) => {
  const deuda = await obtenerDeudaPorId(req.params.id);
  res.json(deuda);
};

export const actualizarDeudaHandler = async (req: Request, res: Response) => {
  const deuda = await actualizarDeuda(req.params.id, req.body);
  res.json(deuda);
};

export const eliminarDeudaHandler = async (req: Request, res: Response) => {
  await eliminarDeuda(req.params.id);
  res.json({ mensaje: 'Deuda eliminada' });
};

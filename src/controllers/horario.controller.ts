import { Request, Response } from 'express';
import { crearHorario, listarHorarios, obtenerHorarioPorId, actualizarHorario, eliminarHorario } from '../services/horario.service';

export const crearHorarioHandler = async (req: Request, res: Response) => {
  const horario = await crearHorario(req.body);
  res.status(201).json(horario);
};

export const listarHorariosHandler = async (_req: Request, res: Response) => {
  const horarios = await listarHorarios();
  res.json(horarios);
};

export const obtenerHorarioHandler = async (req: Request, res: Response) => {
  const horario = await obtenerHorarioPorId(req.params.id);
  res.json(horario);
};

export const actualizarHorarioHandler = async (req: Request, res: Response) => {
  const horario = await actualizarHorario(req.params.id, req.body);
  res.json(horario);
};

export const eliminarHorarioHandler = async (req: Request, res: Response) => {
  await eliminarHorario(req.params.id);
  res.json({ mensaje: 'Horario eliminado' });
};

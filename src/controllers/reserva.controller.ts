import { Request, Response } from 'express';
import {
  crearReserva,
  confirmarReserva,
  cancelarReserva,
  obtenerTodas,
  obtenerPorId,
  buscarJugadoresDisponibles
} from '../services/reserva.service';

export const crearReservaHandler = async (req: Request, res: Response) => {
  try {
    const { usuarioId, canchaId, fecha, hora } = req.body;
    if (!usuarioId || !canchaId || !fecha || !hora) {
      res.status(400).json({ error: 'Faltan datos requeridos' });
      return;
    }

    const resultado = await crearReserva({ usuarioId, canchaId, fecha, hora });
    res.status(201).json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const confirmarReservaHandler = async (req: Request, res: Response) => {
  try {
    const resultado = await confirmarReserva(req.params.id);
    res.status(200).json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const cancelarReservaHandler = async (req: Request, res: Response) => {
  try {
    const resultado = await cancelarReserva(req.params.id);
    res.status(200).json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const obtenerTodasHandler = async (_req: Request, res: Response) => {
  const reservas = await obtenerTodas();
  res.json(reservas);
};

export const obtenerPorIdHandler = async (req: Request, res: Response) => {
  try {
    const reserva = await obtenerPorId(req.params.id);
    res.json(reserva);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const buscarJugadoresDisponiblesHandler = async (req: Request, res: Response) => {
  try {
    const resultado = await buscarJugadoresDisponibles(req.params.id);
    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

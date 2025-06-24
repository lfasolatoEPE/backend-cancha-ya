import { Request, Response } from 'express';
import { procesarReserva } from '../services/reserva.service';

export const crearReserva = (req: Request, res: Response) => {
  try {
    const resultado = procesarReserva(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al reservar', error });
  }
};

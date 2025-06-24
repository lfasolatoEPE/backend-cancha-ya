import { Request, Response } from 'express';
import { procesarReserva, procesarConfirmacion, procesarCancelacion } from '../services/reserva.service';

export const crearReserva = (req: Request, res: Response) => {
  try {
    const resultado = procesarReserva(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear reserva', error });
  }
};

export const confirmarAsistencia = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const resultado = procesarConfirmacion(id);
    res.status(200).json(resultado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al confirmar asistencia', error });
  }
};

export const cancelarReserva = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const resultado = procesarCancelacion(id);
    res.status(200).json(resultado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al cancelar reserva', error });
  }
};

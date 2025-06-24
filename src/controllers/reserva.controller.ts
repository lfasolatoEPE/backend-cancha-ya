import { Request, Response } from 'express';

export const reservarCancha = (req: Request, res: Response) => {
  const { usuarioId, canchaId, fecha } = req.body;

  // Simular validación de deuda
  const tieneDeuda = false;

  if (tieneDeuda) {
    return res.status(403).json({ mensaje: 'No podés reservar. Tenés deuda pendiente.' });
  }

  // Simular reserva exitosa
  return res.status(200).json({ mensaje: 'Reserva confirmada', canchaId, fecha });
};

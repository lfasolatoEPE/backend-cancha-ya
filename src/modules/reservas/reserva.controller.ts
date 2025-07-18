import { Request, Response } from 'express';
import { ReservaService } from './reserva.service';

export class ReservaController {
  constructor(private service: ReservaService) {}

  crearReserva = async (req: Request, res: Response) => {
    try {
      const reserva = await this.service.crearReserva(req.body);
      res.status(201).json(reserva);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  confirmarReserva = async (req: Request, res: Response) => {
    try {
      const result = await this.service.confirmarReserva(req.params.id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  cancelarReserva = async (req: Request, res: Response) => {
    try {
      const result = await this.service.cancelarReserva(req.params.id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  obtenerTodas = async (_req: Request, res: Response) => {
    const reservas = await this.service.obtenerTodas();
    res.json(reservas);
  };

  obtenerPorId = async (req: Request, res: Response) => {
    try {
      const reserva = await this.service.obtenerPorId(req.params.id);
      res.json(reserva);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };
}

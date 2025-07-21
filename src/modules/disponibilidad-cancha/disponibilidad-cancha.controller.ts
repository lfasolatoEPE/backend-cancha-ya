import { Request, Response } from 'express';
import { DisponibilidadCanchaService } from './disponibilidad-cancha.service';

export class DisponibilidadCanchaController {
  constructor(private service: DisponibilidadCanchaService) {}

  crear = async (req: Request, res: Response) => {
    try {
      const nueva = await this.service.crear(req.body);
      res.status(201).json(nueva);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listarPorCancha = async (req: Request, res: Response) => {
    try {
      const canchaId = req.params.canchaId;
      const lista = await this.service.listarPorCancha(canchaId);
      res.json(lista);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      await this.service.eliminar(req.params.id);
      res.json({ mensaje: 'Disponibilidad eliminada' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

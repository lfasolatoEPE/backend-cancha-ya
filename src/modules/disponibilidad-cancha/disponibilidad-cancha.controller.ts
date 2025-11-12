import { Request, Response } from 'express';
import { DisponibilidadCanchaService } from './disponibilidad-cancha.service';
import { CrearDisponibilidadLoteDto } from './dto/crear-disponibilidad-lote.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';

export class DisponibilidadCanchaController {
  constructor(private service: DisponibilidadCanchaService) {}

  crear = async (req: Request, res: Response) => {
    try {
      const dto = req.body as CrearDisponibilidadLoteDto;
      const result = await this.service.crearLote(dto);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // NUEVO: disponibilidad por rango (sin generar filas por fecha)
  disponibilidadRango = async (req: Request, res: Response) => {
    try {
      const dto = req.query as unknown as AvailabilityQueryDto;
      const data = await this.service.disponibilidadRango(dto);
      res.json(data);
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

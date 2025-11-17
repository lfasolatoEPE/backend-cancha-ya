import { Request, Response } from 'express';
import { ReservaService } from './reserva.service';
import { ActualizarReservaDto } from './dto/actualizar-reserva.dto';

export class ReservaController {
  constructor(private service: ReservaService) {}

  crearReserva = async (req: Request, res: Response) => {
    try {
      const token = (req as any).user;
      if (!token?.personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const { disponibilidadId, fechaHora } = req.body; // personaId se ignora
      const reserva = await this.service.crearReserva({
        personaId: token.personaId,
        disponibilidadId,
        fechaHora,
        usuarioId: token.id,
      });
      res.status(201).json(reserva);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // 🔄 NUEVO: actualizar reserva (solo pendiente)
  actualizarReserva = async (req: Request, res: Response) => {
    try {
      const token = (req as any).user;
      if (!token?.id) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const dto = req.body as ActualizarReservaDto;
      const result = await this.service.actualizarReserva(req.params.id, dto, token.id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  confirmarReserva = async (req: Request, res: Response) => {
    try {
      const token = (req as any).user;
      const result = await this.service.confirmarReserva(req.params.id, token?.id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  cancelarReserva = async (req: Request, res: Response) => {
    try {
      const token = (req as any).user;
      const result = await this.service.cancelarReserva(req.params.id, token?.id);
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

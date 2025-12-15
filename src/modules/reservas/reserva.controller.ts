import { Request, Response } from 'express';
import { ReservaService } from './reserva.service';
import { ActualizarReservaDto } from './dto/actualizar-reserva.dto';

export class ReservaController {
  constructor(private service: ReservaService) {}

  crearReserva = async (req: Request, res: Response) => {
    try {
      const token = (req as any).user;
      if (!token?.personaId || !token?.nivelAcceso) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const { disponibilidadId, fechaHora, personaId } = req.body;

      // usuario normal: siempre se fuerza a su personaId
      // admin/admin-club: puede asignar a otro (si viene personaId)
      const personaIdFinal =
        token.nivelAcceso === 'admin' || token.nivelAcceso === 'admin-club'
          ? (personaId ?? token.personaId)
          : token.personaId;

      const reserva = await this.service.crearReserva({
        actorUsuarioId: token.id,
        actorNivelAcceso: token.nivelAcceso,
        actorClubIds: token.clubIds ?? [],
        personaId: personaIdFinal,
        disponibilidadId,
        fechaHora,
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

  obtenerTodas = async (req: Request, res: Response) => {
    const token = (req as any).user;
    const reservas = await this.service.obtenerTodas({
      actorUsuarioId: token.id,
      actorPersonaId: token.personaId,
      actorNivelAcceso: token.nivelAcceso,
      actorClubIds: token.clubIds ?? [],
    });
    res.json(reservas);
  };

  obtenerPorId = async (req: Request, res: Response) => {
    try {
      const token = (req as any).user;
      const reserva = await this.service.obtenerPorId(req.params.id, {
        actorUsuarioId: token.id,
        actorPersonaId: token.personaId,
        actorNivelAcceso: token.nivelAcceso,
        actorClubIds: token.clubIds ?? [],
      });
      res.json(reserva);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };
}

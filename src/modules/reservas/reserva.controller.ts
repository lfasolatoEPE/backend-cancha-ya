import { Request, Response } from 'express';
import { ReservaService } from './reserva.service';
import { ActualizarReservaDto } from './dto/actualizar-reserva.dto';
import { NivelAcceso } from '../../entities/Rol.entity';

type JwtUser = {
  id: string;
  personaId?: string;
  email?: string;
  rol?: string; // informativo
  nivelAcceso?: NivelAcceso | string;
  clubIds?: string[];
};

export class ReservaController {
  constructor(private service: ReservaService) {}

  private getActor(req: Request) {
    const token = (req as any).user as JwtUser | undefined;
    if (!token?.id) throw new Error('No autenticado');

    const nivelAcceso = (token.nivelAcceso ?? NivelAcceso.Usuario) as NivelAcceso;
    const clubIds = Array.isArray(token.clubIds) ? token.clubIds : [];

    return {
      actorUsuarioId: token.id,
      actorPersonaId: token.personaId,
      actorNivelAcceso: nivelAcceso,
      actorClubIds: clubIds,
    };
  }

  crearReserva = async (req: Request, res: Response) => {
    try {
      const actor = this.getActor(req);
      if (!actor.actorPersonaId && actor.actorNivelAcceso === NivelAcceso.Usuario) {
        res.status(401).json({ error: 'Token inválido: falta personaId' });
        return;
      }

      const { disponibilidadId, fechaHora, personaId } = req.body;

      // usuario normal: siempre su personaId
      // admin/admin-club: puede asignar a otro (si viene personaId)
      const personaIdFinal =
        actor.actorNivelAcceso === NivelAcceso.Admin || actor.actorNivelAcceso === NivelAcceso.AdminClub
          ? (personaId ?? actor.actorPersonaId)
          : actor.actorPersonaId;

      if (!personaIdFinal) {
        res.status(400).json({ error: 'personaId requerido' });
        return;
      }

      const reserva = await this.service.crearReserva({
        ...actor,
        personaId: personaIdFinal,
        disponibilidadId,
        fechaHora,
      });

      res.status(201).json(reserva);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  actualizarReserva = async (req: Request, res: Response) => {
    try {
      const actor = this.getActor(req);
      const dto = req.body as ActualizarReservaDto;

      const result = await this.service.actualizarReserva(req.params.id, dto, actor);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  confirmarReserva = async (req: Request, res: Response) => {
    try {
      const actor = this.getActor(req);
      const result = await this.service.confirmarReserva(req.params.id, actor);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  cancelarReserva = async (req: Request, res: Response) => {
    try {
      const actor = this.getActor(req);
      const result = await this.service.cancelarReserva(req.params.id, actor);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  obtenerMisReservas = async (req: Request, res: Response) => {
    try {
      const actor = this.getActor(req);
      const reservas = await this.service.obtenerMisReservas(actor);
      res.json(reservas);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  obtenerTodas = async (req: Request, res: Response) => {
    try {
      const actor = this.getActor(req);

      const { from, to, clubId, canchaId, estado } = req.query as any;

      const reservas = await this.service.obtenerTodas(actor, {
        from,
        to,
        clubId,
        canchaId,
        estado,
      });

      res.json(reservas);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  obtenerPorId = async (req: Request, res: Response) => {
    try {
      const actor = this.getActor(req);
      const reserva = await this.service.obtenerPorId(req.params.id, actor);
      res.json(reserva);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };
}

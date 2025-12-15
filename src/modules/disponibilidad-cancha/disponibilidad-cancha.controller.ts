import { Request, Response } from 'express';
import { DisponibilidadCanchaService } from './disponibilidad-cancha.service';
import { CrearDisponibilidadLoteDto } from './dto/crear-disponibilidad-lote.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { NivelAcceso } from '../../entities/Rol.entity';

type JwtUser = {
  id: string;
  rol: string; // informativo
  nivelAcceso: NivelAcceso;
  personaId: string;
  email: string;
  clubIds?: string[];
};

export class DisponibilidadCanchaController {
  constructor(private service: DisponibilidadCanchaService) {}

  private getScope(req: Request): { clubIds?: string[] } {
    const user = (req as any).user as JwtUser | undefined;
    if (!user) return {};

    if (user.nivelAcceso === NivelAcceso.AdminClub) {
      return { clubIds: user.clubIds ?? [] };
    }

    return {}; // admin global → sin filtro
  }

  crear = async (req: Request, res: Response) => {
    try {
      const dto = req.body as CrearDisponibilidadLoteDto;
      const scope = this.getScope(req);
      const result = await this.service.crearLote(dto, scope.clubIds);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  disponibilidadRango = async (req: Request, res: Response) => {
    try {
      const dto = req.query as unknown as AvailabilityQueryDto;
      const scope = this.getScope(req);
      const data = await this.service.disponibilidadRango(dto, scope.clubIds);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listarPorCancha = async (req: Request, res: Response) => {
    try {
      const canchaId = req.params.canchaId;
      const scope = this.getScope(req);
      const lista = await this.service.listarPorCancha(canchaId, scope.clubIds);
      res.json(lista);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      const scope = this.getScope(req);
      await this.service.eliminar(req.params.id, scope.clubIds);
      res.json({ mensaje: 'Disponibilidad eliminada' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

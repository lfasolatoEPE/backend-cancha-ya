import { Request, Response } from 'express';
import { DisponibilidadService } from './disponibilidad.service';
import { CrearDisponibilidadDto } from './dto/crear-disponibilidad.dto';

export class DisponibilidadController {
  constructor(private service: DisponibilidadService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const personaId = (req as any).usuario.id;
      const dto = req.body as CrearDisponibilidadDto;
      const disponibilidad = await this.service.crear(personaId, dto);
      res.status(201).json(disponibilidad);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listarPorPersona = async (req: Request, res: Response): Promise<void> => {
    const personaId = (req as any).usuario.id;
    const lista = await this.service.listarPorPersona(personaId);
    res.json(lista);
  };
}

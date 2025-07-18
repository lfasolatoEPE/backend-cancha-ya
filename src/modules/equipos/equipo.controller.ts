import { Request, Response } from 'express';
import { EquipoService } from './equipo.service';
import { CrearEquipoDto } from './dto/crear-equipo.dto';

export class EquipoController {
  constructor(private service: EquipoService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CrearEquipoDto;
      const equipo = await this.service.crear(dto);
      res.status(201).json(equipo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    const equipos = await this.service.listar();
    res.json(equipos);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    try {
      const equipo = await this.service.obtenerPorId(req.params.id);
      res.json(equipo);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };
}

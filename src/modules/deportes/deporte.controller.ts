import { Request, Response } from 'express';
import { DeporteService } from './deporte.service';
import { CrearDeporteDto } from './dto/crear-deporte.dto';

export class DeporteController {
  constructor(private service: DeporteService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CrearDeporteDto;
      const deporte = await this.service.crear(dto);
      res.status(201).json(deporte);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    const deportes = await this.service.listar();
    res.json(deportes);
  };
}

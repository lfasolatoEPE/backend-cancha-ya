import { Request, Response } from 'express';
import { DeporteService } from './deporte.service';
import { CrearDeporteDto } from './dto/crear-deporte.dto';
import { UpdateDeporteDto } from './dto/update-deporte.dto';

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

  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as UpdateDeporteDto;
      const deporte = await this.service.actualizar(req.params.id, dto);
      res.json(deporte);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    const deportes = await this.service.listar();
    res.json(deportes);
  };

  // opcional: si agregás la ruta GET /:id
  // obtener = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const deporte = await this.service.obtenerPorId(req.params.id);
  //     res.json(deporte);
  //   } catch (error: any) {
  //     res.status(404).json({ error: error.message });
  //   }
  // };
}

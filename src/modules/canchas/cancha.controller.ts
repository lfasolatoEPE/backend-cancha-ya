import { Request, Response } from 'express';
import { CanchaService } from './cancha.service';
import { CrearCanchaDto } from './dto/crear-cancha.dto';

export class CanchaController {
  constructor(private service: CanchaService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CrearCanchaDto;
      const cancha = await this.service.crear(dto);
      res.status(201).json(cancha);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    const canchas = await this.service.listar();
    res.json(canchas);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    try {
      const cancha = await this.service.obtenerPorId(req.params.id);
      res.json(cancha);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  listarPorClub = async (req: Request, res: Response): Promise<void> => {
    try {
      const canchas = await this.service.listarPorClub(req.params.clubId);
      res.json(canchas);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

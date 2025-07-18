import { Request, Response } from 'express';
import { ClubService } from './club.service';
import { CrearClubDto } from './dto/crear-club.dto';

export class ClubController {
  constructor(private service: ClubService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CrearClubDto;
      const club = await this.service.crear(dto);
      res.status(201).json(club);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    const clubes = await this.service.listar();
    res.json(clubes);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    try {
      const club = await this.service.obtenerPorId(req.params.id);
      res.json(club);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };
}

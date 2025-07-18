import { Request, Response } from 'express';
import { HorarioService } from './horario.service';
import { CrearHorarioDto } from './dto/crear-horario.dto';

export class HorarioController {
  constructor(private service: HorarioService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CrearHorarioDto;
      const horario = await this.service.crear(dto);
      res.status(201).json(horario);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    const horarios = await this.service.listar();
    res.json(horarios);
  };
}

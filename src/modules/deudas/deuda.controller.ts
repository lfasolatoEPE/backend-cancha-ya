import { Request, Response } from 'express';
import { DeudaService } from './deuda.service';
import { CrearDeudaDto } from './dto/crear-deuda.dto';

export class DeudaController {
  constructor(private service: DeudaService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CrearDeudaDto;
      const deuda = await this.service.crear(dto);
      res.status(201).json(deuda);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (req: Request, res: Response): Promise<void> => {
    const { personaId } = req.query;
    const deudas = await this.service.listar(personaId as string | undefined);
    res.json(deudas);
  };

  marcarPagada = async (req: Request, res: Response): Promise<void> => {
    try {
      const deuda = await this.service.marcarPagada(req.params.id);
      res.json(deuda);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.eliminar(req.params.id);
      res.json({ mensaje: 'Deuda eliminada' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

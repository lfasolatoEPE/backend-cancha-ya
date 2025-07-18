import { Request, Response } from 'express';
import { PersonaService } from './persona.service';
import { ActualizarPersonaDto } from './dto/actualizar-persona.dto';

export class PersonaController {
  constructor(private service: PersonaService) {}

  listar = async (_req: Request, res: Response): Promise<void> => {
    const personas = await this.service.listar();
    res.json(personas);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    try {
      const persona = await this.service.obtenerPorId(req.params.id);
      res.json(persona);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const persona = await this.service.actualizar(req.params.id, req.body as ActualizarPersonaDto);
      res.json(persona);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.eliminar(req.params.id);
      res.json({ mensaje: 'Persona eliminada' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

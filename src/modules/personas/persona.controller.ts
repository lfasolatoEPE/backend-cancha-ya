import { Request, RequestHandler, Response } from 'express';
import { PersonaService } from './persona.service';
import { ActualizarPersonaDto } from './dto/actualizar-persona.dto';
import { AppDataSource } from '../../database/data-source';
import { Persona } from '../../entities/Persona.entity';

export class PersonaController {
  private repo = AppDataSource.getRepository(Persona);
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

  search: RequestHandler = async (req, res) => {
    try {
      const q = String(req.query.q ?? '').trim();
      if (!q || q.length < 2) {
        res.json([]);
        return;
      }

      const personas = await this.repo
        .createQueryBuilder('p')
        .where('p.nombre ILIKE :q OR p.apellido ILIKE :q', { q: `%${q}%` })
        .orderBy('p.apellido', 'ASC')
        .addOrderBy('p.nombre', 'ASC')
        .limit(20)
        .getMany();

      res.json(personas);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };
}

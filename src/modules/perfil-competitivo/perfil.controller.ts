import { Request, Response } from 'express';
import { PerfilService } from './perfil.service';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

export class PerfilController {
  constructor(private service: PerfilService) {}

  private getPersonaId(req: Request) {
    // Ajustar según tu authMiddleware. En tu proyecto veníamos usando personaId.
    return (req as any).user?.personaId as string;
  }

  obtenerMiPerfil = async (req: Request, res: Response) => {
    try {
      const personaId = this.getPersonaId(req);
      const perfil = await this.service.obtenerMiPerfil(personaId);
      res.json(perfil);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  actualizarMiPerfil = async (req: Request, res: Response) => {
    try {
      const personaId = this.getPersonaId(req);
      const dto = req.body as ActualizarPerfilDto;
      const perfil = await this.service.actualizarMiPerfil(personaId, dto);
      res.json(perfil);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };
}

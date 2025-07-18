import { Request, Response } from 'express';
import { PerfilService } from './perfil.service';

export class PerfilController {
  constructor(private service: PerfilService) {}

  obtenerMiPerfil = async (req: Request, res: Response): Promise<void> => {
    const usuarioId = (req as any).usuario.id;
    const perfil = await this.service.obtenerPorUsuario(usuarioId);
    res.json(perfil);
  };

  actualizarMiPerfil = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuarioId = (req as any).usuario.id;
      const perfil = await this.service.actualizar(usuarioId, req.body);
      res.json(perfil);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

// src/modules/perfil-competitivo/perfil.controller.ts
import { Request, Response } from 'express';
import { PerfilService } from './perfil.service';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

export class PerfilController {
  constructor(private service: PerfilService) {}

  private getPersonaId(req: Request) {
    return (req as any).user?.personaId as string;
  }

  obtenerMiPerfil = async (req: Request, res: Response) => {
    try {
      const personaId = this.getPersonaId(req);
      if (!personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const perfil = await this.service.obtenerMiPerfil(personaId);
      res.json(perfil);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  // 🔹 NUEVO: historial de ELO del logueado
  obtenerMiHistorialElo = async (req: Request, res: Response) => {
    try {
      const personaId = this.getPersonaId(req);
      if (!personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const historial = await this.service.obtenerMiHistorialElo(personaId);
      res.json(historial);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  actualizarMiPerfil = async (req: Request, res: Response) => {
    try {
      const personaId = this.getPersonaId(req);
      if (!personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      const dto = req.body as ActualizarPerfilDto;
      const perfil = await this.service.actualizarMiPerfil(personaId, dto);
      res.json(perfil);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };
}

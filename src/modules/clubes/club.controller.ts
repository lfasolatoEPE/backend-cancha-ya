// src/modules/club/club.controller.ts
import { Request, Response } from 'express';
import { ClubService } from './club.service';
import { CrearClubDto } from './dto/crear-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubIdsDto } from './dto/club-ids.dto';

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

  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = (req as any).user;
      const isAdmin = token?.rol === 'admin';
      const isAdminClub = token?.rol === 'admin-club';
      const clubIds: string[] = token?.clubIds ?? [];

      if (isAdminClub && !clubIds.includes(req.params.id)) {
        res.status(403).json({ error: 'No puedes modificar otros clubes' });
        return;
      }

      const dto = req.body as UpdateClubDto;
      const club = await this.service.actualizar(req.params.id, dto);
      res.json(club);
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
      const token = (req as any).user;
      const isAdminClub = token?.rol === 'admin-club';
      const clubIds: string[] = token?.clubIds ?? [];

      if (isAdminClub && !clubIds.includes(req.params.id)) {
        res.status(403).json({ error: 'No puedes ver otros clubes' });
        return;
      }

      const club = await this.service.obtenerPorId(req.params.id);
      res.json(club);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  obtenerCanchasIdsPorClubes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clubIds } = req.body as ClubIdsDto;
      const ids = await this.service.obtenerCanchasIdsPorClubes(clubIds);
      res.json({ canchaIds: ids });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  obtenerCanchasIdsPorClubesQuery = async (req: Request, res: Response): Promise<void> => {
    try {
      const raw = String(req.query.clubIds ?? '').trim();
      if (!raw) {
        res.status(400).json({ error: 'Debe enviar clubIds (comma-separated)' });
        return;
      }
      const clubIds = raw.split(',').map((s) => s.trim()).filter(Boolean);
      const ids = await this.service.obtenerCanchasIdsPorClubes(clubIds);
      res.json({ canchaIds: ids });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

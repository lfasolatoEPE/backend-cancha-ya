import { Request, Response } from 'express';
import { CanchaService } from './cancha.service';
import { CrearCanchaDto } from './dto/crear-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';
import { uploadImageBuffer } from '../../services/image.service';

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

  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as UpdateCanchaDto;
      const cancha = await this.service.actualizar(req.params.id, dto);
      res.json(cancha);
    } catch (error: any) {
      const code = /no encontrada|no encontrado|existe/.test(error.message) ? 400 : 500;
      res.status(code).json({ error: error.message });
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

  subirFoto = async (req: any, res: any) => {
    try {
      const canchaId = req.params.id;
      if (!req.file) {
        res.status(400).json({ error: 'Falta archivo (file)' });
        return;
      }
      const { url } = await uploadImageBuffer(req.file.buffer, `${process.env.CLOUDINARY_FOLDER}/canchas/${canchaId}`);
      const foto = await this.service.agregarFoto(canchaId, url);
      res.status(201).json(foto);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  listarFotos = async (req: any, res: any) => {
    try {
      const out = await this.service.listarFotos(req.params.id);
      res.json(out);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  eliminarFoto = async (req: any, res: any) => {
    try {
      await this.service.eliminarFoto(req.params.id, req.params.fotoId);
      res.json({ mensaje: 'Foto eliminada' });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };
}

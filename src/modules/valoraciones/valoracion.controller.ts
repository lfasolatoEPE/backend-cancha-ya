import { Request, Response } from 'express';
import { ValoracionService } from './valoracion.service';
import { CrearValoracionDto } from './dto/crear-valoracion.dto';

export class ValoracionController {
  constructor(private service: ValoracionService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CrearValoracionDto;
      const usuarioToken = (req as any).usuario;
      const valoracion = await this.service.crearValoracion(usuarioToken.id, dto);
      res.status(201).json(valoracion);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    const valoraciones = await this.service.listarValoraciones();
    res.json(valoraciones);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    try {
      const valoracion = await this.service.obtenerValoracionPorId(req.params.id);
      res.json(valoracion);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.eliminarValoracion(req.params.id);
      res.json({ mensaje: 'Valoración eliminada' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

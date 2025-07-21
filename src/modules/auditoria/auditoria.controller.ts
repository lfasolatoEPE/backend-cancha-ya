import { Request, Response } from 'express';
import { AuditoriaService } from './auditoria.service';

export class AuditoriaController {
  constructor(private service: AuditoriaService) {}

  listar = async (req: Request, res: Response) => {
    const filtros = req.query;
    const auditorias = await this.service.listar(filtros);
    res.json(auditorias);
  };
}

import { Request, Response } from 'express';
import { DesafioService } from './desafio.service';
import { CrearDesafioDto } from './dto/crear-desafio.dto';
import { AceptarDesafioDto } from './dto/aceptar-desafio.dto';
import { FinalizarDesafioDto } from './dto/finalizar-desafio.dto';
import { FiltroDesafioDto } from './dto/filtro-desafio.dto';

export class DesafioController {
  constructor(private service: DesafioService) {}

  crear = async (req: Request, res: Response) => {
    try {
      const dto = req.body as CrearDesafioDto;
      const desafio = await this.service.crearDesafio(dto);
      res.status(201).json(desafio);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  aceptar = async (req: Request, res: Response) => {
    try {
      const { equipoRivalId } = req.body as AceptarDesafioDto;
      const desafio = await this.service.aceptarDesafio(req.params.id, equipoRivalId);
      res.json(desafio);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  finalizar = async (req: Request, res: Response) => {
    try {
      const { resultado } = req.body as FinalizarDesafioDto;
      const desafio = await this.service.finalizarDesafio(req.params.id, resultado);
      res.json(desafio);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (req: Request, res: Response) => {
    try {
      const filtros = req.query as FiltroDesafioDto;
      const lista = await this.service.listarDesafios(filtros);
      res.json(lista);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

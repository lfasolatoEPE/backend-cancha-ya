import { Request, Response } from 'express';
import { DesafioService } from './desafio.service';
import { CrearDesafioDto } from './dto/crear-desafio.dto';
import { AgregarJugadoresDto } from './dto/agregar-jugadores.dto';
import { FinalizarDesafioDto } from './dto/finalizar-desafio.dto';

export class DesafioController {
  constructor(private service: DesafioService) {}

  private getPersonaId(req: Request) {
    return (req as any).user?.personaId as string;
  }

  crear = async (req: Request, res: Response) => {
    try {
      const dto = req.body as CrearDesafioDto;
      const personaId = this.getPersonaId(req);
      const desafio = await this.service.crearDesafio(dto, personaId);
      res.status(201).json(desafio);
    } catch (error: any) {
      console.error('[crear] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  aceptarDesafio = async (req: Request, res: Response) => {
    try {
      const personaId = this.getPersonaId(req);
      const desafio = await this.service.aceptarDesafio(req.params.id, personaId);
      res.json(desafio);
    } catch (error: any) {
      console.error('[aceptarDesafio] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  rechazarDesafio = async (req: Request, res: Response) => {
    try {
      const personaId = this.getPersonaId(req);
      const desafio = await this.service.rechazarDesafio(req.params.id, personaId);
      res.json(desafio);
    } catch (error: any) {
      console.error('[rechazarDesafio] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  agregarJugadores = async (req: Request, res: Response) => {
    try {
      const dto = req.body as AgregarJugadoresDto;
      const solicitanteId = this.getPersonaId(req);
      const desafio = await this.service.agregarJugadores(req.params.id, solicitanteId, dto);
      res.json(desafio);
    } catch (error: any) {
      console.error('[agregarJugadores] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  finalizar = async (req: Request, res: Response) => {
    try {
      const dto = req.body as FinalizarDesafioDto;
      const solicitanteId = this.getPersonaId(req);
      const desafio = await this.service.finalizarDesafio(req.params.id, solicitanteId, dto);
      res.json(desafio);
    } catch (error: any) {
      console.error('[finalizar] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (_req: Request, res: Response) => {
    try {
      const lista = await this.service.listarDesafios();
      res.json(lista);
    } catch (error: any) {
      console.error('[listar] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };
}
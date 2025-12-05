import { Request, Response } from 'express';
import { DesafioService } from './desafio.service';
import { CrearDesafioDto } from './dto/crear-desafio.dto';
import { AgregarJugadoresDto } from './dto/agregar-jugadores.dto';
import { FinalizarDesafioDto } from './dto/finalizar-desafio.dto';
import { FiltroDesafioDto } from './dto/filtro-desafio.dto';

interface UsuarioJwtPayload {
  personaId: string;
  rol: string; // ej: 'admin', 'usuario', 'admin_club', etc.
}

export class DesafioController {
  constructor(private service: DesafioService) {}

  private getUsuario(req: Request): UsuarioJwtPayload | undefined {
    return (req as any).user as UsuarioJwtPayload | undefined;
  }

  private getPersonaId(req: Request): string | undefined {
    return this.getUsuario(req)?.personaId;
  }

  // ---------- MÉTODOS ----------

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CrearDesafioDto;
      const personaId = this.getPersonaId(req);
      if (!personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const desafio = await this.service.crearDesafio(dto, personaId);
      res.status(201).json(desafio);
    } catch (error: any) {
      console.error('[crear] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  aceptarDesafio = async (req: Request, res: Response): Promise<void> => {
    try {
      const personaId = this.getPersonaId(req);
      if (!personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const desafio = await this.service.aceptarDesafio(req.params.id, personaId);
      res.json(desafio);
    } catch (error: any) {
      console.error('[aceptarDesafio] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  rechazarDesafio = async (req: Request, res: Response): Promise<void> => {
    try {
      const personaId = this.getPersonaId(req);
      if (!personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const desafio = await this.service.rechazarDesafio(req.params.id, personaId);
      res.json(desafio);
    } catch (error: any) {
      console.error('[rechazarDesafio] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  cancelarDesafio = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = this.getUsuario(req);
      if (!usuario?.personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const esAdmin = usuario.rol === 'admin';

      const desafio = await this.service.cancelarDesafio(
        req.params.id,
        usuario.personaId,
        esAdmin,
      );
      res.json(desafio);
    } catch (error: any) {
      console.error('[cancelar] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  agregarJugadores = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as AgregarJugadoresDto;
      const usuario = this.getUsuario(req);
      if (!usuario?.personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const esAdmin = usuario.rol === 'admin';

      const desafio = await this.service.agregarJugadores(
        req.params.id,
        usuario.personaId,
        esAdmin,
        dto,
      );
      res.json(desafio);
    } catch (error: any) {
      console.error('[agregarJugadores] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  finalizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as FinalizarDesafioDto;
      const personaId = this.getPersonaId(req);
      if (!personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const desafio = await this.service.finalizarDesafio(
        req.params.id,
        personaId,
        dto,
      );
      res.json(desafio);
    } catch (error: any) {
      console.error('[finalizar] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = this.getUsuario(req);
      if (!usuario?.personaId) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const esAdmin = usuario.rol === 'admin';

      const filtro: FiltroDesafioDto = {
        estado: req.query.estado as any,
        deporteId: req.query.deporteId as any,
        jugadorId: req.query.jugadorId as any, // sólo se usa si es admin
      };

      const lista = await this.service.listarDesafios(
        usuario.personaId,
        filtro,
        esAdmin,
      );
      res.json(lista);
    } catch (error: any) {
      console.error('[listar] Error:', error);
      res.status(400).json({ error: error.message });
    }
  };
}

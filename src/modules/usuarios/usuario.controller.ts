import { Request, Response } from 'express';
import { UsuarioService } from './usuario.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CambiarRolDto } from './dto/cambiar-rol.dto';
import { isDuplicateError } from '../../utils/db';

export class UsuarioController {
  constructor(private service: UsuarioService) {}

  crearUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CrearUsuarioDto;
      const usuario = await this.service.crearUsuario(dto);
      res.status(201).json(usuario);
    } catch (error: any) {
      const msg = String(error?.message ?? 'Error creando usuario');
      if (msg.includes('registrado') || isDuplicateError(error)) {
        res.status(409).json({ error: msg });
        return;
      }
      res.status(400).json({ error: msg });
    }
  };

  crearAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CrearUsuarioDto;
      const usuario = await this.service.crearAdmin(body);
      res.status(201).json(usuario);
    } catch (error: any) {
      const msg = String(error?.message ?? 'Error creando admin');
      if (msg.includes('registrado') || isDuplicateError(error)) {
        res.status(409).json({ error: msg });
        return;
      }
      res.status(400).json({ error: msg });
    }
  };

  obtenerUsuarios = async (_req: Request, res: Response): Promise<void> => {
    try {
      const usuarios = await this.service.listarUsuarios();
      res.status(200).json(usuarios);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  actualizarUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const body = req.body as ActualizarUsuarioDto;
      const usuarioToken = (req as any).user;

      if (!usuarioToken || (usuarioToken.rol !== 'admin' && usuarioToken.id !== id)) {
        res.status(403).json({ mensaje: 'No tienes permiso para modificar este usuario' });
        return;
      }

      const usuario = await this.service.actualizarUsuario(id, body);
      res.json(usuario);
    } catch (error: any) {
      const msg = String(error?.message ?? 'Error actualizando usuario');
      if (msg.includes('registrado') || isDuplicateError(error)) {
        res.status(409).json({ error: msg });
        return;
      }
      res.status(400).json({ error: msg });
    }
  };

  cambiarRol = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dto = req.body as CambiarRolDto;
      const out = await this.service.cambiarRol(id, dto.rol, dto.clubIds);
      res.json(out);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };
}

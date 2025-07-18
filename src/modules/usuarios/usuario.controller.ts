import { Request, Response } from 'express';
import { UsuarioService } from './usuario.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';

export class UsuarioController {
  constructor(private service: UsuarioService) {}

  crearUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto = req.body as CrearUsuarioDto;
      const usuario = await this.service.crearUsuario(dto);
      res.status(201).json(usuario); 
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  obtenerUsuarios = async (_req: Request, res: Response) => {
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
      const usuarioToken = (req as any).usuario;

      // Control de permisos: solo el usuario o un admin puede modificar
      if (!usuarioToken || (usuarioToken.rol !== 'admin' && usuarioToken.id !== id)) {
        res.status(403).json({ mensaje: 'No tienes permiso para modificar este usuario' });
        return;
      }

      const usuario = await this.service.actualizarUsuario(id, body);
      res.json(usuario);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

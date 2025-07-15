import { Request, Response } from 'express';
import { crearUsuario, crearAdmin, listarUsuarios, actualizarUsuario } from '../services/usuario.service';

export const registrarUsuario = async (req: Request, res: Response) => {
  try {
    const usuario = await crearUsuario(req.body);
    res.status(201).json(usuario);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
};

export const registrarAdmin = async (req: Request, res: Response) => {
  try {
    const usuario = await crearAdmin(req.body);
    res.status(201).json(usuario);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
};

export const obtenerUsuarios = async (_req: Request, res: Response) => {
  try {
    const usuarios = await listarUsuarios();
    res.status(200).json(usuarios);
  } catch (error: any) {
    res.status(500).json({ mensaje: error.message });
  }
};

export const actualizarUsuarioHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const usuarioToken = (req as any).usuario;

    // Solo el propio usuario o admin
    if (usuarioToken.rol !== 'admin' && usuarioToken.id !== id) {
      res.status(403).json({ mensaje: 'No tienes permiso para modificar este usuario' });
      return;
    }

    const usuario = await actualizarUsuario(id, req.body);
    res.json(usuario);
  } catch (error: any) {
    res.status(400).json({ mensaje: error.message });
  }
};
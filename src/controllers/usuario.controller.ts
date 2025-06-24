import { Request, Response } from 'express';
import { crearUsuario, listarUsuarios } from '../services/usuario.service';

export const registrarUsuario = (req: Request, res: Response) => {
  try {
    const usuario = crearUsuario(req.body);
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al registrar usuario', error });
  }
};

export const obtenerUsuarios = (_req: Request, res: Response) => {
  try {
    const usuarios = listarUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error });
  }
};
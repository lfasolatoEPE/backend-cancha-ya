import { Request, Response } from "express";
import * as service from "../services/equipo.service";

export const crearEquipoHandler = async (req: Request, res: Response) => {
  try {
    const creado = await service.crearEquipo(req.body);
    res.status(201).json(creado);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const listarEquiposHandler = async (_req: Request, res: Response) => {
  const lista = await service.listarEquipos();
  res.json(lista);
};

export const obtenerEquipoHandler = async (req: Request, res: Response) => {
  try {
    const equipo = await service.obtenerEquipoPorId(req.params.id);
    res.json(equipo);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
};

export const actualizarEquipoHandler = async (req: Request, res: Response) => {
  try {
    const actualizado = await service.actualizarEquipo(req.params.id, req.body);
    res.json(actualizado);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const eliminarEquipoHandler = async (req: Request, res: Response) => {
  try {
    const eliminado = await service.eliminarEquipo(req.params.id);
    res.json(eliminado);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

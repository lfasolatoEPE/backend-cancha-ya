import { Request, Response } from 'express';
import * as service from '../services/desafio.service';
import { FiltroDesafioDto } from '../dtos/desafio-filtro.dto';

export const crearDesafioHandler = async (req: Request, res: Response) => {
  try {
    const { equipoRetadorId, deporteId, fecha, hora } = req.body;
    const creado = await service.crearDesafio({ equipoRetadorId, deporteId, fecha, hora });
    res.status(201).json(creado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const aceptarDesafioHandler = async (req: Request, res: Response) => {
  try {
    const { equipoRivalId } = req.body;
    const actualizado = await service.aceptarDesafio(req.params.id, equipoRivalId);
    res.json(actualizado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const finalizarDesafioHandler = async (req: Request, res: Response) => {
  try {
    const { resultado } = req.body;
    const actualizado = await service.finalizarDesafio(req.params.id, resultado);
    res.json(actualizado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const listarDesafiosHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    estado,
    deporteId,
    equipoId,
    jugadorId,
    fecha
  } = req.query;

  const estadoValido = ['pendiente', 'aceptado', 'finalizado'];
  if (estado && !estadoValido.includes(estado as string)) {
    res.status(400).json({ error: 'Estado inválido' });
    return;
  }

  const lista = await service.listarDesafios({
    estado: estado as string | undefined,
    deporteId: deporteId as string | undefined,
    equipoId: equipoId as string | undefined,
    jugadorId: jugadorId as string | undefined,
    fecha: fecha as string | undefined,
  });

  res.json(lista);
};

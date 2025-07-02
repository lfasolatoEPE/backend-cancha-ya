import { Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validateOrReject } from "class-validator";
import * as service from "../services/disponibilidadJugador.service";
import { CreateDisponibilidadJugadorDto } from "../dtos/disponibilidadJugador.dto";

export const crear = async (req: Request, res: Response) => {
  // Transformar y validar input
  const dto = plainToInstance(CreateDisponibilidadJugadorDto, req.body);
  await validateOrReject(dto);

  const usuarioId = (req as any).usuario.id;

  // Convertir fechas a Date
  const fechaDesdeDate = new Date(dto.fechaDesde);
  const fechaHastaDate = new Date(dto.fechaHasta);

  const disponibilidad = await service.crearDisponibilidad({
    usuarioId,
    fechaDesde: fechaDesdeDate,
    fechaHasta: fechaHastaDate,
    horaDesde: dto.horaDesde,
    horaHasta: dto.horaHasta,
    clubesIds: dto.clubes,
    deporteId: dto.deporteId
  });

  res.status(201).json(disponibilidad);
};

export const listar = async (_: Request, res: Response) => {
  const todas = await service.obtenerDisponibilidades();
  res.json(todas);
};

export const eliminar = async (req: Request, res: Response) => {
  const { id } = req.params;
  await service.eliminarDisponibilidad(id);
  res.json({ mensaje: "Disponibilidad eliminada" });
};

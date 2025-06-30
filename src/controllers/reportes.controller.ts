import { Request, Response } from "express";
import * as service from "../services/reportes.service";

export const reservasPorFechas = async (req: Request, res: Response) => {
  const { desde, hasta } = req.query;
  const result = await service.obtenerReservasPorRangoFechas(
    String(desde),
    String(hasta)
  );
  res.json(result);
};

export const ingresosPorClub = async (req: Request, res: Response) => {
  const { desde, hasta } = req.query;
  const result = await service.obtenerIngresosPorClub(
    String(desde),
    String(hasta)
  );
  res.json(result);
};

export const canchasMasReservadas = async (req: Request, res: Response) => {
  const result = await service.obtenerCanchasMasReservadas();
  res.json(result);
};

export const usuariosMasActivos = async (req: Request, res: Response) => {
  const result = await service.obtenerUsuariosMasActivos();
  res.json(result);
};

export const ocupacionPorHorario = async (req: Request, res: Response) => {
  const result = await service.obtenerOcupacionPorHorario();
  res.json(result);
};

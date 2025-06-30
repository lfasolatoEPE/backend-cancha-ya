import { AppDataSource } from "../database/data-source";
import { Reserva } from "../entities/Reserva.entity";
import { Cancha } from "../entities/Cancha.entity";
import { Club } from "../entities/Club.entity";
import { Usuario } from "../entities/Usuario.entity";
import { Between } from "typeorm";

const reservaRepo = AppDataSource.getRepository(Reserva);

export const obtenerReservasPorRangoFechas = async (desde: string, hasta: string) => {
  return await reservaRepo.find({
    where: { fecha: Between(desde, hasta) },
    relations: ["cancha", "usuario"],
    order: { fecha: "ASC" }
  });
};

export const obtenerIngresosPorClub = async (desde: string, hasta: string) => {
  const result = await reservaRepo
    .createQueryBuilder("reserva")
    .innerJoinAndSelect("reserva.cancha", "cancha")
    .innerJoinAndSelect("cancha.club", "club")
    .select("club.nombre", "club")
    .addSelect("SUM(cancha.precioPorHora)", "ingresos")
    .where("reserva.fecha BETWEEN :desde AND :hasta", { desde, hasta })
    .groupBy("club.id")
    .getRawMany();
  return result;
};

export const obtenerCanchasMasReservadas = async () => {
  const result = await reservaRepo
    .createQueryBuilder("reserva")
    .innerJoinAndSelect("reserva.cancha", "cancha")
    .select("cancha.nombre", "cancha")
    .addSelect("COUNT(*)", "cantidad")
    .groupBy("cancha.id")
    .orderBy("cantidad", "DESC")
    .limit(5)
    .getRawMany();
  return result;
};

export const obtenerUsuariosMasActivos = async () => {
  const result = await reservaRepo
    .createQueryBuilder("reserva")
    .innerJoinAndSelect("reserva.usuario", "usuario")
    .select("usuario.email", "usuario")
    .addSelect("COUNT(*)", "cantidad")
    .groupBy("usuario.id")
    .orderBy("cantidad", "DESC")
    .limit(5)
    .getRawMany();
  return result;
};

export const obtenerOcupacionPorHorario = async () => {
  const result = await reservaRepo
    .createQueryBuilder("reserva")
    .select("reserva.hora", "hora")
    .addSelect("COUNT(*)", "cantidad")
    .groupBy("reserva.hora")
    .orderBy("cantidad", "DESC")
    .getRawMany();
  return result;
};

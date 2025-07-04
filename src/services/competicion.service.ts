import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario.entity';
import { Equipo } from '../entities/Equipo.entity';
import { Deporte } from "../entities/Deporte.entity";

const usuarioRepo = AppDataSource.getRepository(Usuario);
const equipoRepo = AppDataSource.getRepository(Equipo);
const deporteRepo = AppDataSource.getRepository(Deporte);

export const listarRankingJugadores = async (deporteId?: string) => {
  const query = usuarioRepo
    .createQueryBuilder('usuario')
    .leftJoinAndSelect('usuario.equipos', 'equipo');

  if (deporteId) {
    query.andWhere('equipo.deporte = :deporteId', { deporteId });
  }

  query.orderBy('usuario.ranking', 'DESC');

  return await query.getMany();
};

export const listarRankingEquipos = async (deporteId?: string) => {
  const query = equipoRepo
    .createQueryBuilder("equipo")
    .leftJoinAndSelect("equipo.deporte", "deporte")
    .leftJoinAndSelect("equipo.jugadores", "jugadores")
    .orderBy("equipo.ranking", "DESC");

  if (deporteId) {
    query.andWhere("equipo.deporte = :deporteId", { deporteId });
  }

  return await query.getMany();
};
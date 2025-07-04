import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario.entity';
import { Equipo } from '../entities/Equipo.entity';

const usuarioRepo = AppDataSource.getRepository(Usuario);

export const listarRankingJugadores = async (deporteId?: string) => {
  const query = usuarioRepo
    .createQueryBuilder('usuario')
    .leftJoinAndSelect('usuario.equipos', 'equipo');

  if (deporteId) {
    query.andWhere('equipo.deporte = :deporteId', { deporteId });
  }

  query.orderBy('usuario.rankingCompetitivo', 'DESC');

  return await query.getMany();
};

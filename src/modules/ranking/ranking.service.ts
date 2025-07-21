import { AppDataSource } from '../../database/data-source';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { Usuario } from '../../entities/Usuario.entity';
import { Equipo } from '../../entities/Equipo.entity';

const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
const equipoRepo = AppDataSource.getRepository(Equipo);

export class RankingService {
  async rankingGeneral() {
    const perfiles = await perfilRepo.find({
      relations: ['usuario', 'usuario.persona'],
      order: { ranking: 'DESC' }
    });

    return perfiles.map(p => ({
      usuarioId: p.usuario.id,
      nombre: p.usuario.persona.nombre,
      apellido: p.usuario.persona.apellido,
      ranking: p.ranking,
      modoCompetitivo: p.modoCompetitivo
    }));
  }

  async rankingPorDeporte(deporteId: string) {
    const equipos = await equipoRepo.find({
      where: { deporte: { id: deporteId } },
      relations: ['jugadores', 'deporte'],
      order: { ranking: 'DESC' }
    });

    return equipos.map(equipo => ({
      equipoId: equipo.id,
      nombre: equipo.nombre,
      ranking: equipo.ranking,
      jugadores: equipo.jugadores.map(j => ({
        id: j.id,
        nombre: j.nombre,
        apellido: j.apellido
      })),
      deporte: equipo.deporte.nombre
    }));
  }

  async perfilDeUsuario(usuarioId: string) {
    const perfil = await perfilRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario', 'usuario.persona']
    });

    if (!perfil) throw new Error('Perfil no encontrado');

    return {
      usuarioId,
      nombre: perfil.usuario.persona.nombre,
      apellido: perfil.usuario.persona.apellido,
      ranking: perfil.ranking,
      modoCompetitivo: perfil.modoCompetitivo
    };
  }
}

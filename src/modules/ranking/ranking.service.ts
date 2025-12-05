// src/modules/ranking/ranking.service.ts
import { AppDataSource } from '../../database/data-source';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { Usuario } from '../../entities/Usuario.entity';
import { EloHistory } from '../../entities/EloHistory.entity';

const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const eloHistoryRepo = AppDataSource.getRepository(EloHistory);

export class RankingService {
  async rankingGeneral() {
    const perfiles = await perfilRepo.find({
      relations: ['usuario', 'usuario.persona'],
      where: { activo: true },
      order: {
        ranking: 'DESC',
        partidosJugados: 'DESC',
      },
    });

    return perfiles.map((p, index) => ({
      posicion: index + 1,
      usuarioId: p.usuario.id,
      nombre: p.usuario.persona.nombre,
      apellido: p.usuario.persona.apellido,
      ranking: p.ranking,
      partidosJugados: p.partidosJugados,
      victorias: p.victorias,
      derrotas: p.derrotas,
      empates: p.empates,
      activo: p.activo,
    }));
  }

  async perfilDeUsuario(usuarioId: string) {
    const perfil = await perfilRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario', 'usuario.persona'],
    });

    if (!perfil) throw new Error('Perfil no encontrado');

    const historial = await eloHistoryRepo.find({
      where: { perfil: { id: perfil.id } },
      order: { creadoEl: 'DESC' },
      take: 10, // últimos 10 movimientos
    });

    return {
      usuarioId,
      nombre: perfil.usuario.persona.nombre,
      apellido: perfil.usuario.persona.apellido,
      ranking: perfil.ranking,
      activo: perfil.activo,
      partidosJugados: perfil.partidosJugados,
      victorias: perfil.victorias,
      empates: perfil.empates,
      derrotas: perfil.derrotas,
      golesFavor: perfil.golesFavor,
      golesContra: perfil.golesContra,
      racha: perfil.racha,
      historialElo: historial,
    };
  }

  // 🔹 NUEVO: perfil del usuario logueado, via personaId -> usuarioId
  async perfilDeMiUsuario(personaId: string) {
    const usuario = await usuarioRepo.findOne({
      where: { persona: { id: personaId } },
      relations: ['persona'],
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado para la persona logueada');
    }

    // reutilizamos la lógica de perfilDeUsuario
    return this.perfilDeUsuario(usuario.id);
  }
}

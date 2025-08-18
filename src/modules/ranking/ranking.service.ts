import { AppDataSource } from '../../database/data-source';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';

const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);

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
      activo: p.activo
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
      activo: perfil.activo
    };
  }
}

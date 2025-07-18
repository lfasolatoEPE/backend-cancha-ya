import { AppDataSource } from '../../database/data-source';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { Usuario } from '../../entities/Usuario.entity';

const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
const usuarioRepo = AppDataSource.getRepository(Usuario);

export class PerfilService {
  async obtenerPorUsuario(usuarioId: string) {
    const perfil = await perfilRepo.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario']
    });

    if (!perfil) throw new Error('Perfil no encontrado');
    return perfil;
  }

  async actualizar(usuarioId: string, data: { modoCompetitivo?: boolean; ranking?: number }) {
    let perfil = await perfilRepo.findOne({ where: { usuario: { id: usuarioId } } });

    if (!perfil) {
      const usuario = await usuarioRepo.findOneBy({ id: usuarioId });
      if (!usuario) throw new Error('Usuario no encontrado');

      perfil = perfilRepo.create({
        usuario,
        modoCompetitivo: data.modoCompetitivo ?? false,
        ranking: data.ranking ?? 1000
      });

      return await perfilRepo.save(perfil);
    }

    if (data.modoCompetitivo !== undefined) perfil.modoCompetitivo = data.modoCompetitivo;
    if (data.ranking !== undefined) perfil.ranking = data.ranking;

    return await perfilRepo.save(perfil);
  }
}

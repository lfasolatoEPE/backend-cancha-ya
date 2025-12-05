// src/modules/perfil-competitivo/perfil.service.ts
import { AppDataSource } from '../../database/data-source';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { Usuario } from '../../entities/Usuario.entity';
import { EloHistory } from '../../entities/EloHistory.entity';

const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const eloHistoryRepo = AppDataSource.getRepository(EloHistory);

// Debe coincidir con el usado en desafíos
const ELO_INICIAL = 1200;

export class PerfilService {
  /**
   * Devuelve el perfil del usuario (lo crea si no existe).
   */
  async obtenerMiPerfil(personaId: string) {
    const usuario = await usuarioRepo.findOne({
      where: { persona: { id: personaId } },
      relations: ['persona'],
    });
    if (!usuario) throw new Error('Usuario no encontrado');

    let perfil = await perfilRepo.findOne({
      where: { usuario: { id: usuario.id } },
      relations: ['usuario', 'usuario.persona'],
    });

    if (!perfil) {
      perfil = perfilRepo.create({
        usuario,
        ranking: ELO_INICIAL,
        activo: true,
      });
      perfil = await perfilRepo.save(perfil);
    }

    return perfil;
  }

  /**
   * 🔹 Nuevo: historial de cambios de ELO del usuario logueado.
   */
  async obtenerMiHistorialElo(personaId: string) {
    const usuario = await usuarioRepo.findOne({
      where: { persona: { id: personaId } },
    });
    if (!usuario) throw new Error('Usuario no encontrado');

    const perfil = await perfilRepo.findOne({
      where: { usuario: { id: usuario.id } },
    });

    if (!perfil) {
      // Nunca jugó / nunca se creó el perfil -> sin historial
      return [];
    }

    const historial = await eloHistoryRepo.find({
      where: { perfil: { id: perfil.id } },
      relations: ['desafio'],
      order: { creadoEl: 'ASC' }, // para graficar evolución
    });

    return historial;
  }

  /**
   * Permite modificar banderas del perfil (no el ranking).
   */
  async actualizarMiPerfil(personaId: string, dto: { activo?: boolean }) {
    const usuario = await usuarioRepo.findOne({
      where: { persona: { id: personaId } },
      relations: ['persona'],
    });
    if (!usuario) throw new Error('Usuario no encontrado');

    let perfil = await perfilRepo.findOne({
      where: { usuario: { id: usuario.id } },
      relations: ['usuario', 'usuario.persona'],
    });

    if (!perfil) {
      perfil = perfilRepo.create({
        usuario,
        ranking: ELO_INICIAL,
        activo: true,
      });
    }

    if (dto.activo !== undefined) {
      perfil.activo = dto.activo;
    }

    return await perfilRepo.save(perfil);
  }
}

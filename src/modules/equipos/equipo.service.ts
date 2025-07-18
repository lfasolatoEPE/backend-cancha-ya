import { AppDataSource } from '../../database/data-source';
import { Equipo } from '../../entities/Equipo.entity';
import { Persona } from '../../entities/Persona.entity';
import { Deporte } from '../../entities/Deporte.entity';

const equipoRepo = AppDataSource.getRepository(Equipo);
const personaRepo = AppDataSource.getRepository(Persona);
const deporteRepo = AppDataSource.getRepository(Deporte);

export class EquipoService {
  async crear(data: {
    nombre: string;
    deporteId: string;
    jugadoresIds: string[];
  }) {
    const deporte = await deporteRepo.findOneBy({ id: data.deporteId });
    if (!deporte) throw new Error('Deporte no encontrado');

    const jugadores = await personaRepo.findByIds(data.jugadoresIds);
    if (jugadores.length !== data.jugadoresIds.length) {
      throw new Error('Alguno de los jugadores no existe');
    }

    const equipo = equipoRepo.create({
      nombre: data.nombre,
      deporte,
      jugadores,
      ranking: 1000,
      partidosJugados: 0,
      partidosGanados: 0
    });

    return await equipoRepo.save(equipo);
  }

  async listar() {
    return await equipoRepo.find({
      order: { ranking: 'DESC' },
      relations: ['deporte', 'jugadores']
    });
  }

  async obtenerPorId(id: string) {
    const equipo = await equipoRepo.findOne({
      where: { id },
      relations: ['deporte', 'jugadores']
    });
    if (!equipo) throw new Error('Equipo no encontrado');
    return equipo;
  }
}

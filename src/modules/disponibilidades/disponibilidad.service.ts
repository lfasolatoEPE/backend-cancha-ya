import { AppDataSource } from '../../database/data-source';
import { DisponibilidadPersona } from '../../entities/DisponibilidadPersona.entity';
import { Persona } from '../../entities/Persona.entity';
import { Club } from '../../entities/Club.entity';
import { Deporte } from '../../entities/Deporte.entity';

const dispoRepo = AppDataSource.getRepository(DisponibilidadPersona);
const personaRepo = AppDataSource.getRepository(Persona);
const clubRepo = AppDataSource.getRepository(Club);
const deporteRepo = AppDataSource.getRepository(Deporte);

export class DisponibilidadService {
  async crear(personaId: string, data: {
    fechaDesde: string;
    fechaHasta: string;
    horaDesde: string;
    horaHasta: string;
    deporteId: string;
    clubesIds: string[];
  }) {
    const persona = await personaRepo.findOneBy({ id: personaId });
    if (!persona) throw new Error('Persona no encontrada');

    const deporte = await deporteRepo.findOneBy({ id: data.deporteId });
    if (!deporte) throw new Error('Deporte no encontrado');

    const clubes = await clubRepo.findByIds(data.clubesIds);
    if (clubes.length !== data.clubesIds.length) {
      throw new Error('Alguno de los clubes no existe');
    }

    const nueva = dispoRepo.create({
      fechaDesde: new Date(data.fechaDesde),
      fechaHasta: new Date(data.fechaHasta),
      horaDesde: data.horaDesde,
      horaHasta: data.horaHasta,
      persona,
      deporte,
      clubes
    });

    return await dispoRepo.save(nueva);
  }

  async listarPorPersona(personaId: string) {
    return await dispoRepo.find({
      where: { persona: { id: personaId } },
      relations: ['deporte', 'clubes'],
      order: { fechaDesde: 'ASC' }
    });
  }
}

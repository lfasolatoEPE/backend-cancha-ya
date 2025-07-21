import { AppDataSource } from '../../database/data-source';
import { DisponibilidadHorario } from '../../entities/DisponibilidadHorario.entity';
import { Cancha } from '../../entities/Cancha.entity';
import { Horario } from '../../entities/Horario.entity';

const disponibilidadRepo = AppDataSource.getRepository(DisponibilidadHorario);
const canchaRepo = AppDataSource.getRepository(Cancha);
const horarioRepo = AppDataSource.getRepository(Horario);

export class DisponibilidadCanchaService {
  async crear(data: {
    canchaId: string;
    horarioId: string;
    diaSemana: number;
    disponible?: boolean;
  }) {
    const cancha = await canchaRepo.findOneBy({ id: data.canchaId });
    if (!cancha) throw new Error('Cancha no encontrada');

    const horario = await horarioRepo.findOneBy({ id: data.horarioId });
    if (!horario) throw new Error('Horario no encontrado');

    const yaExiste = await disponibilidadRepo.findOne({
      where: {
        cancha: { id: data.canchaId },
        horario: { id: data.horarioId },
        diaSemana: data.diaSemana
      }
    });

    if (yaExiste) throw new Error('Ya existe una disponibilidad para ese día y horario');

    const nueva = disponibilidadRepo.create({
      cancha,
      horario,
      diaSemana: data.diaSemana,
      disponible: data.disponible ?? true
    });

    return await disponibilidadRepo.save(nueva);
  }

  async listarPorCancha(canchaId: string) {
    return await disponibilidadRepo.find({
      where: { cancha: { id: canchaId } },
      relations: ['horario']
    });
  }

  async eliminar(id: string) {
    const disponibilidad = await disponibilidadRepo.findOneBy({ id });
    if (!disponibilidad) throw new Error('Disponibilidad no encontrada');
    return await disponibilidadRepo.remove(disponibilidad);
  }
}

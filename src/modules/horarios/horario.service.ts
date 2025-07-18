import { AppDataSource } from '../../database/data-source';
import { Horario } from '../../entities/Horario.entity';

const repo = AppDataSource.getRepository(Horario);

export class HorarioService {
  async crear(data: { horaInicio: string; horaFin: string }) {
    if (data.horaInicio >= data.horaFin) {
      throw new Error('La hora de inicio debe ser menor a la de fin');
    }

    const horario = repo.create({
      horaInicio: data.horaInicio,
      horaFin: data.horaFin
    });

    return await repo.save(horario);
  }

  async listar() {
    return await repo.find({ order: { horaInicio: 'ASC' } });
  }
}

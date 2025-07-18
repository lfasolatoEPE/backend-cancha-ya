import { AppDataSource } from '../../database/data-source';
import { Club } from '../../entities/Club.entity';

const repo = AppDataSource.getRepository(Club);

export class ClubService {
  async crear(data: { nombre: string; direccion: string; telefono: string; email: string }) {
    const existente = await repo.findOneBy({ email: data.email });
    if (existente) throw new Error('Ya existe un club con ese email');

    const nuevo = repo.create(data);
    return await repo.save(nuevo);
  }

  async listar() {
    return await repo.find({ order: { nombre: 'ASC' } });
  }

  async obtenerPorId(id: string) {
    const club = await repo.findOne({
      where: { id },
      relations: ['canchas']
    });
    if (!club) throw new Error('Club no encontrado');
    return club;
  }
}

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

  async actualizar(
    id: string,
    data: Partial<{ nombre: string; direccion: string; telefono: string; email: string }>
  ) {
    const club = await repo.findOneBy({ id });
    if (!club) throw new Error('Club no encontrado');

    // Validar duplicado por email
    if (data.email && data.email !== club.email) {
      const dup = await repo.findOne({ where: { email: data.email } });
      if (dup && dup.id !== club.id) throw new Error('Ya existe un club con ese email');
      club.email = data.email;
    }

    if (data.nombre !== undefined) club.nombre = data.nombre;
    if (data.direccion !== undefined) club.direccion = data.direccion;
    if (data.telefono !== undefined) club.telefono = data.telefono;

    return await repo.save(club);
  }

  async listar() {
    return await repo.find({ order: { nombre: 'ASC' } });
  }

  async obtenerPorId(id: string) {
    const club = await repo.findOne({
      where: { id },
      relations: ['canchas'],
    });
    if (!club) throw new Error('Club no encontrado');
    return club;
  }
}

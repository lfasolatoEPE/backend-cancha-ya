import { AppDataSource } from '../../database/data-source';
import { Club } from '../../entities/Club.entity';
import { Cancha } from '../../entities/Cancha.entity';
import { In } from 'typeorm';

const repo = AppDataSource.getRepository(Club);
const canchaRepo = AppDataSource.getRepository(Cancha);

export class ClubService {
  async crear(data: { 
    nombre: string; 
    direccion: string; 
    telefono: string; 
    email: string;
    latitud?: number | null;
    longitud?: number | null;
  }) {
    const existente = await repo.findOneBy({ email: data.email });
    if (existente) throw new Error('Ya existe un club con ese email');

    const nuevo = repo.create({
      nombre: data.nombre,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      latitud: data.latitud ?? null,
      longitud: data.longitud ?? null,
    });
    return await repo.save(nuevo);
  }

  async actualizar(
    id: string,
    data: Partial<{ 
      nombre: string; 
      direccion: string; 
      telefono: string; 
      email: string;
      latitud: number | null;
      longitud: number | null;
    }>
  ) {
    const club = await repo.findOneBy({ id });
    if (!club) throw new Error('Club no encontrado');

    if (data.email && data.email !== club.email) {
      const dup = await repo.findOne({ where: { email: data.email } });
      if (dup && dup.id !== club.id) throw new Error('Ya existe un club con ese email');
      club.email = data.email;
    }

    if (data.nombre !== undefined) club.nombre = data.nombre;
    if (data.direccion !== undefined) club.direccion = data.direccion;
    if (data.telefono !== undefined) club.telefono = data.telefono;
    if (data.latitud !== undefined) club.latitud = data.latitud;
    if (data.longitud !== undefined) club.longitud = data.longitud;

    return await repo.save(club);
  }

  async listar() {
    return await repo.find({ order: { nombre: 'ASC' }, relations: ['canchas'] });
  }

  async obtenerPorId(id: string) {
    const club = await repo.findOne({
      where: { id },
      relations: ['canchas'],
    });
    if (!club) throw new Error('Club no encontrado');
    return club;
  }

  async obtenerCanchasIdsPorClubes(clubIds: string[]): Promise<string[]> {
    if (!clubIds?.length) throw new Error('clubIds no puede ser vacío');

    const canchas = await canchaRepo.find({
      select: ['id'],
      where: { club: { id: In(clubIds) } as any },
    });

    return canchas.map(c => c.id);
  }
}

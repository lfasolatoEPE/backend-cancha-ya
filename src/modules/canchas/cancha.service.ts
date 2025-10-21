import { AppDataSource } from '../../database/data-source';
import { Cancha } from '../../entities/Cancha.entity';
import { Club } from '../../entities/Club.entity';
import { Deporte } from '../../entities/Deporte.entity';
import { isDuplicateError } from '../../utils/db';

const canchaRepo = AppDataSource.getRepository(Cancha);
const clubRepo = AppDataSource.getRepository(Club);
const deporteRepo = AppDataSource.getRepository(Deporte);

export class CanchaService {
  async crear(data: {
    nombre: string;
    ubicacion: string;
    precioPorHora: number;
    tipoSuperficie: string;
    clubId: string;
    deporteId: string;
  }) {
    const club = await clubRepo.findOneBy({ id: data.clubId });
    if (!club) throw new Error('Club no encontrado');

    const deporte = await deporteRepo.findOneBy({ id: data.deporteId });
    if (!deporte) throw new Error('Deporte no encontrado');

    // (opcional) evitar nombre duplicado por club
    const dup = await canchaRepo.findOne({ where: { nombre: data.nombre, club: { id: data.clubId } } as any });
    if (dup) throw new Error('Ya existe una cancha con ese nombre en el club');

    const cancha = canchaRepo.create({
      nombre: data.nombre,
      ubicacion: data.ubicacion,
      precioPorHora: data.precioPorHora,
      tipoSuperficie: data.tipoSuperficie,
      club,
      deporte,
    });

    try {
      return await canchaRepo.save(cancha);
    } catch (err) {
      if (isDuplicateError(err)) throw new Error('Cancha duplicada');
      throw err;
    }
  }

  async listar() {
    return await canchaRepo.find({
      relations: ['club', 'deporte'],
      order: { nombre: 'ASC' },
    });
  }

  async obtenerPorId(id: string) {
    const cancha = await canchaRepo.findOne({
      where: { id },
      relations: ['club', 'deporte'],
    });
    if (!cancha) throw new Error('Cancha no encontrada');
    return cancha;
  }

  async listarPorClub(clubId: string) {
    const club = await clubRepo.findOneBy({ id: clubId });
    if (!club) throw new Error('Club no encontrado');

    return await canchaRepo.find({
      where: { club: { id: clubId } },
      relations: ['deporte'],
      order: { nombre: 'ASC' },
    });
  }
}

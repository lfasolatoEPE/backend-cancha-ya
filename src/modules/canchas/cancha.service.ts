import { AppDataSource } from '../../database/data-source';
import { Cancha } from '../../entities/Cancha.entity';
import { CanchaFoto } from '../../entities/CanchaFoto.entity';
import { Club } from '../../entities/Club.entity';
import { Deporte } from '../../entities/Deporte.entity';
import { isDuplicateError } from '../../utils/db';

const canchaRepo = AppDataSource.getRepository(Cancha);
const clubRepo = AppDataSource.getRepository(Club);
const deporteRepo = AppDataSource.getRepository(Deporte);
const fotoRepo = AppDataSource.getRepository(CanchaFoto);

export class CanchaService {
  async crear(data: {
    nombre: string;
    ubicacion: string;          // referencia interna
    precioPorHora: number;
    tipoSuperficie: string;
    clubId: string;
    deporteId: string;
  }) {
    const club = await clubRepo.findOneBy({ id: data.clubId });
    if (!club) throw new Error('Club no encontrado');

    const deporte = await deporteRepo.findOneBy({ id: data.deporteId });
    if (!deporte) throw new Error('Deporte no encontrado');

    const dup = await canchaRepo.findOne({
      where: { nombre: data.nombre, club: { id: data.clubId } } as any,
    });
    if (dup) throw new Error('Ya existe una cancha con ese nombre en el club');

    const cancha = canchaRepo.create({
      nombre: data.nombre,
      ubicacion: data.ubicacion,
      precioPorHora: Number(data.precioPorHora),
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

  async actualizar(
    id: string,
    data: Partial<{
      nombre: string;
      ubicacion: string;
      precioPorHora: number;
      tipoSuperficie: string;
      clubId: string;
      deporteId: string;
    }>
  ) {
    const cancha = await canchaRepo.findOne({
      where: { id },
      relations: ['club', 'deporte'],
    });
    if (!cancha) throw new Error('Cancha no encontrada');

    // cambio de club
    if (data.clubId && data.clubId !== cancha.club?.id) {
      const club = await clubRepo.findOneBy({ id: data.clubId });
      if (!club) throw new Error('Club no encontrado');
      cancha.club = club;
    }

    // cambio de deporte
    if (data.deporteId && data.deporteId !== cancha.deporte?.id) {
      const deporte = await deporteRepo.findOneBy({ id: data.deporteId });
      if (!deporte) throw new Error('Deporte no encontrado');
      cancha.deporte = deporte;
    }

    // validar duplicado nombre+club
    const nombreDestino = data.nombre ?? cancha.nombre;
    const clubDestinoId = cancha.club?.id;
    if (nombreDestino && clubDestinoId) {
      const dup = await canchaRepo.findOne({
        where: { nombre: nombreDestino, club: { id: clubDestinoId } } as any,
      });
      if (dup && dup.id !== cancha.id) {
        throw new Error('Ya existe una cancha con ese nombre en el club');
      }
    }

    // merge campos simples
    if (data.nombre !== undefined) cancha.nombre = data.nombre;
    if (data.ubicacion !== undefined) cancha.ubicacion = data.ubicacion;
    if (data.precioPorHora !== undefined) cancha.precioPorHora = Number(data.precioPorHora);
    if (data.tipoSuperficie !== undefined) cancha.tipoSuperficie = data.tipoSuperficie;

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

  async agregarFoto(canchaId: string, url: string) {
    const cancha = await canchaRepo.findOneBy({ id: canchaId });
    if (!cancha) throw new Error('Cancha no encontrada');

    const last = await fotoRepo.find({
      where: { cancha: { id: canchaId } as any },
      order: { orden: 'DESC' },
      take: 1,
    });
    const nextOrden = last[0]?.orden ? last[0].orden + 1 : 1;

    const ent = fotoRepo.create({ cancha, url, orden: nextOrden });
    return await fotoRepo.save(ent);
  }

  async listarFotos(canchaId: string) {
    return await fotoRepo.find({
      where: { cancha: { id: canchaId } as any },
      order: { orden: 'ASC', creadaEl: 'ASC' },
    });
  }

  async eliminarFoto(canchaId: string, fotoId: string) {
    const foto = await fotoRepo.findOne({
      where: { id: fotoId },
      relations: ['cancha'],
    });
    if (!foto || foto.cancha.id !== canchaId) throw new Error('Foto no encontrada');
    await fotoRepo.remove(foto);
  }
}

import { AppDataSource } from '../../database/data-source';
import { Auditoria } from '../../entities/Auditoria.entity';

const auditoriaRepo = AppDataSource.getRepository(Auditoria);

export class AuditoriaService {
  async registrar(data: {
    usuarioId: string;
    accion: string;
    entidad: string;
    entidadId: string;
    descripcion?: string;
  }) {
    const auditoria = auditoriaRepo.create({
      usuario: { id: data.usuarioId } as any,
      accion: data.accion,
      entidad: data.entidad,
      entidadId: data.entidadId,
      descripcion: data.descripcion
    });

    return await auditoriaRepo.save(auditoria);
  }

  async listar(filtros: {
    usuarioId?: string;
    entidad?: string;
    accion?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) {
    const query = auditoriaRepo
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.usuario', 'usuario');

    if (filtros.usuarioId) {
      query.andWhere('usuario.id = :usuarioId', { usuarioId: filtros.usuarioId });
    }

    if (filtros.entidad) {
      query.andWhere('audit.entidad = :entidad', { entidad: filtros.entidad });
    }

    if (filtros.accion) {
      query.andWhere('audit.accion = :accion', { accion: filtros.accion });
    }

    if (filtros.fechaDesde) {
      query.andWhere('audit.fecha >= :desde', { desde: filtros.fechaDesde });
    }

    if (filtros.fechaHasta) {
      query.andWhere('audit.fecha <= :hasta', { hasta: filtros.fechaHasta });
    }

    return await query.orderBy('audit.fecha', 'DESC').getMany();
  }
}

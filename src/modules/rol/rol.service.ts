import { AppDataSource } from '../../database/data-source';
import { Rol, TipoRol, NivelAcceso } from '../../entities/Rol.entity';
import { isDuplicateError } from '../../utils/db';
import { CrearRolDto } from './dto/crear-rol.dto';

const rolRepo = AppDataSource.getRepository(Rol);

export class RolService {
  async crearRol(dto: CrearRolDto) {
    const nombreNorm = dto.nombre.trim().toLowerCase();

    // No dejar que pisen roles del sistema por nombre
    const reservados = ['admin', 'admin-club', 'usuario'];
    if (reservados.includes(nombreNorm)) {
      throw new Error('Ese rol es reservado del sistema');
    }

    // Forzamos a que los creados desde este endpoint sean de negocio
    const rol = rolRepo.create({
      nombre: nombreNorm,
      tipo: TipoRol.Negocio,
      nivelAcceso: dto.nivelAcceso ?? NivelAcceso.Usuario,
    });

    try {
      await rolRepo.save(rol);
    } catch (e) {
      if (isDuplicateError(e)) {
        throw new Error('Ya existe un rol con ese nombre');
      }
      throw e;
    }

    return rol;
  }

  async listarRoles() {
    const roles = await rolRepo.find({
      order: { tipo: 'ASC', nombre: 'ASC' },
    });

    return roles.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
      nivelAcceso: r.nivelAcceso,
    }));
  }
}

import { AppDataSource } from '../../database/data-source';
import { Rol } from '../../entities/Rol.entity';
import { isDuplicateError } from '../../utils/db';

const rolRepo = AppDataSource.getRepository(Rol);

export class RolService {
  async crearRol(nombre: string) {
    const nombreNorm = nombre.trim().toLowerCase();

    // No dejar que pisen roles del sistema
    const reservados = ['admin', 'admin-club', 'usuario'];
    if (reservados.includes(nombreNorm)) {
      throw new Error('Ese rol es reservado del sistema');
    }

    const rol = rolRepo.create({
      nombre: nombreNorm,
      tipo: 'negocio',
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
    const roles = await rolRepo.find();
    return roles.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
    }));
  }
}

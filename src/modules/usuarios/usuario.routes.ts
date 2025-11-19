import { Router } from 'express';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { validateDto } from '../../utils/validate';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { CambiarRolDto } from './dto/cambiar-rol.dto';
import { AppDataSource } from '../../database/data-source';
import { Usuario } from '../../entities/Usuario.entity';

const router = Router();
const controller = new UsuarioController(new UsuarioService());

// Registro “admin-only” (si querés crear usuarios desde panel)
router.post(
  '/registro',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(CrearUsuarioDto),
  controller.crearUsuario
);

router.post(
  '/admin',
  async (req, res, next) => {
    const allow = process.env.ALLOW_ADMIN_SETUP === 'true';

    if (allow) {
      const countAdmins = await AppDataSource.getRepository(Usuario)
        .createQueryBuilder('u')
        .leftJoin('u.rol', 'r')
        .where('r.nombre = :rol', { rol: 'admin' })
        .getCount();

      if (countAdmins === 0) {
        console.warn('[ADMIN SETUP] Creación de admin sin auth habilitada');
        return next();
      }

      console.warn('[ADMIN SETUP] Bandera ignorada — ya existe un admin, se exige auth');
    }

    // Caso general: auth requerida
    return authMiddleware(req, res, () =>
      authorizeRoles('admin')(req, res, next)
    );
  },
  validateDto(CrearUsuarioDto),
  controller.crearAdmin
);

router.get('/', authMiddleware, authorizeRoles('admin'), controller.obtenerUsuarios);

router.patch(
  '/:id',
  authMiddleware,
  validateDto(ActualizarUsuarioDto),
  controller.actualizarUsuario
);

// cambio de rol
router.patch(
  '/:id/rol',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(CambiarRolDto),
  controller.cambiarRol
);

export default router;

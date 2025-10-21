import { Router } from 'express';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { validateDto } from '../../utils/validate';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { CambiarRolDto } from './dto/cambiar-rol.dto';

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
  authMiddleware,
  authorizeRoles('admin'),
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

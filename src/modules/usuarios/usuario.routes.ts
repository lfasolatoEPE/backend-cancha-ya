import { Router } from 'express';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { validateDto } from '../../utils/validate';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new UsuarioController(new UsuarioService());

router.post(
  '/registro',
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

router.get(
  '/',
  authMiddleware,
  controller.obtenerUsuarios
);

router.patch(
  '/:id',
  authMiddleware,
  validateDto(ActualizarUsuarioDto),
  controller.actualizarUsuario
);

export default router;

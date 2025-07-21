import { Router } from 'express';
import { DisponibilidadCanchaController } from './disponibilidad-cancha.controller';
import { DisponibilidadCanchaService } from './disponibilidad-cancha.service';
import { validateDto } from '../../utils/validate';
import { CrearDisponibilidadDto } from './dto/crear-disponibilidad.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new DisponibilidadCanchaController(new DisponibilidadCanchaService());

router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(CrearDisponibilidadDto),
  controller.crear
);

router.get(
  '/:canchaId',
  authMiddleware,
  controller.listarPorCancha
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  controller.eliminar
);

export default router;

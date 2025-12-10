import { Router } from 'express';
import { DisponibilidadCanchaController } from './disponibilidad-cancha.controller';
import { DisponibilidadCanchaService } from './disponibilidad-cancha.service';
import { validateDto } from '../../utils/validate';
import { CrearDisponibilidadLoteDto } from './dto/crear-disponibilidad-lote.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new DisponibilidadCanchaController(new DisponibilidadCanchaService());

// Alta masiva de patrón semanal (admin global + admin-club)
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'admin-club'),
  validateDto(CrearDisponibilidadLoteDto),
  controller.crear
);

// Disponibilidad dinámica por rango (on-the-fly)
router.get(
  '/availability',
  authMiddleware,
  validateDto(AvailabilityQueryDto),
  controller.disponibilidadRango
);

// Listar patrón (semanal) por cancha
router.get('/:canchaId', authMiddleware, controller.listarPorCancha);

// Borrar una fila de patrón (admin global + admin-club)
router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'admin-club'),
  controller.eliminar
);

export default router;

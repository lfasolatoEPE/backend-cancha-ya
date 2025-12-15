import { Router } from 'express';
import { DisponibilidadCanchaController } from './disponibilidad-cancha.controller';
import { DisponibilidadCanchaService } from './disponibilidad-cancha.service';
import { validateDto } from '../../utils/validate';
import { CrearDisponibilidadLoteDto } from './dto/crear-disponibilidad-lote.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeAccess, authorizeRoles } from '../../middlewares/role.middleware';
import { NivelAcceso } from '../../entities/Rol.entity';

const router = Router();
const controller = new DisponibilidadCanchaController(new DisponibilidadCanchaService());

// Alta masiva de patrón semanal (admin global + admin-club)
router.post(
  '/',
  authMiddleware,
  authorizeAccess(NivelAcceso.Admin, NivelAcceso.AdminClub),
  validateDto(CrearDisponibilidadLoteDto),
  controller.crear
);

// Disponibilidad dinámica por rango (on-the-fly)
router.get(
  '/availability',
  authMiddleware,
  validateDto(AvailabilityQueryDto, 'query'),
  controller.disponibilidadRango
);

// Listar patrón (semanal) por cancha
router.get('/:canchaId', authMiddleware, controller.listarPorCancha);

// Borrar una fila de patrón (admin global + admin-club)
router.delete(
  '/:id',
  authMiddleware,
  authorizeAccess(NivelAcceso.Admin, NivelAcceso.AdminClub),
  controller.eliminar
);

export default router;

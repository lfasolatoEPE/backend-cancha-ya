import { Router } from 'express';
import { DisponibilidadController } from './disponibilidad.controller';
import { DisponibilidadService } from './disponibilidad.service';
import { validateDto } from '../../utils/validate';
import { CrearDisponibilidadDto } from './dto/crear-disponibilidad.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new DisponibilidadController(new DisponibilidadService());

router.post(
  '/',
  authMiddleware,
  validateDto(CrearDisponibilidadDto),
  controller.crear
);

router.get('/', authMiddleware, controller.listarPorPersona);

export default router;

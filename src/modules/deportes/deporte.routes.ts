import { Router } from 'express';
import { DeporteController } from './deporte.controller';
import { DeporteService } from './deporte.service';
import { validateDto } from '../../utils/validate';
import { CrearDeporteDto } from './dto/crear-deporte.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new DeporteController(new DeporteService());

router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(CrearDeporteDto),
  controller.crear
);

router.get('/', controller.listar);

export default router;

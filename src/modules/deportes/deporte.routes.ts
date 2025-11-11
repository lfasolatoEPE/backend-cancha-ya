import { Router } from 'express';
import { DeporteController } from './deporte.controller';
import { DeporteService } from './deporte.service';
import { validateDto } from '../../utils/validate';
import { CrearDeporteDto } from './dto/crear-deporte.dto';
import { UpdateDeporteDto } from './dto/update-deporte.dto';
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

router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(UpdateDeporteDto),
  controller.actualizar
);

// opcional: si querés obtener uno por id
router.get('/', controller.listar);
// router.get('/:id', controller.obtener);

export default router;

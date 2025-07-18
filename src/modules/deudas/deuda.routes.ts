import { Router } from 'express';
import { DeudaController } from './deuda.controller';
import { DeudaService } from './deuda.service';
import { validateDto } from '../../utils/validate';
import { CrearDeudaDto } from './dto/crear-deuda.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new DeudaController(new DeudaService());

router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(CrearDeudaDto),
  controller.crear
);

router.get(
  '/',
  authMiddleware,
  controller.listar
);

router.patch(
  '/:id/pagar',
  authMiddleware,
  authorizeRoles('admin'),
  controller.marcarPagada
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  controller.eliminar
);

export default router;

import { Router } from 'express';
import { CanchaController } from './cancha.controller';
import { CanchaService } from './cancha.service';
import { validateDto } from '../../utils/validate';
import { CrearCanchaDto } from './dto/crear-cancha.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new CanchaController(new CanchaService());

router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(CrearCanchaDto),
  controller.crear
);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.get('/club/:clubId', controller.listarPorClub);

export default router;

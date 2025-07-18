import { Router } from 'express';
import { HorarioController } from './horario.controller';
import { HorarioService } from './horario.service';
import { validateDto } from '../../utils/validate';
import { CrearHorarioDto } from './dto/crear-horario.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new HorarioController(new HorarioService());

router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(CrearHorarioDto),
  controller.crear
);

router.get('/', controller.listar);

export default router;

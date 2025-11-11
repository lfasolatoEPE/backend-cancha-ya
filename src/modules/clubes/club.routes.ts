import { Router } from 'express';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { validateDto } from '../../utils/validate';
import { CrearClubDto } from './dto/crear-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new ClubController(new ClubService());

// 🔒 Solo admin puede crear o editar
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(CrearClubDto),
  controller.crear
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(UpdateClubDto),
  controller.actualizar
);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);

export default router;

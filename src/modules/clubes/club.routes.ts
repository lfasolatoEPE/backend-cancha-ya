import { Router } from 'express';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { validateDto } from '../../utils/validate';
import { CrearClubDto } from './dto/crear-club.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new ClubController(new ClubService());

router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(CrearClubDto),
  controller.crear
);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);

export default router;

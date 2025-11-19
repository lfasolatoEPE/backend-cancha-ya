// src/modules/cancha/cancha.routes.ts
import { Router } from 'express';
import { CanchaController } from './cancha.controller';
import { CanchaService } from './cancha.service';
import { validateDto } from '../../utils/validate';
import { CrearCanchaDto } from './dto/crear-cancha.dto';
import { UpdateCanchaDto } from './dto/update-cancha.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();
const controller = new CanchaController(new CanchaService());

router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'admin-club'),
  validateDto(CrearCanchaDto),
  controller.crear
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'admin-club'),
  validateDto(UpdateCanchaDto),
  controller.actualizar
);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.get('/club/:clubId', controller.listarPorClub);

router.post(
  '/:id/fotos',
  authMiddleware,
  authorizeRoles('admin', 'admin-club'),
  upload.single('file'),
  controller.subirFoto
);

router.get('/:id/fotos', controller.listarFotos);

router.delete(
  '/:id/fotos/:fotoId',
  authMiddleware,
  authorizeRoles('admin', 'admin-club'),
  controller.eliminarFoto
);

export default router;

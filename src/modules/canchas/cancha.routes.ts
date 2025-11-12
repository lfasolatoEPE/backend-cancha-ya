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
  authorizeRoles('admin'),
  validateDto(CrearCanchaDto),
  controller.crear
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(UpdateCanchaDto),      // ← validación parcial
  controller.actualizar
);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.get('/club/:clubId', controller.listarPorClub);

// subir una foto
router.post(
  '/:id/fotos',
  authMiddleware,
  authorizeRoles('admin'),
  upload.single('file'),
  controller.subirFoto
);

// listar fotos
router.get('/:id/fotos', controller.listarFotos);

// eliminar foto
router.delete(
  '/:id/fotos/:fotoId',
  authMiddleware,
  authorizeRoles('admin'),
  controller.eliminarFoto
);

export default router;

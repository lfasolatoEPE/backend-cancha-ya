// src/modules/club/club.routes.ts
import { Router } from 'express';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { validateDto } from '../../utils/validate';
import { CrearClubDto } from './dto/crear-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubIdsDto } from './dto/club-ids.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new ClubController(new ClubService());

// Crear club → solo admin global
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  validateDto(CrearClubDto),
  controller.crear
);

// Editar club → admin o admin-club (control interno por lista)
router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'admin-club'),
  validateDto(UpdateClubDto),
  controller.actualizar
);

// listar público (todos los clubes)
router.get('/', controller.listar);

// ver un club → opcionalmente restringido si viene token admin-club
router.get('/:id', authMiddleware, authorizeRoles('admin', 'admin-club'), controller.obtener);

router.post('/canchas/ids', validateDto(ClubIdsDto), controller.obtenerCanchasIdsPorClubes);
router.get('/canchas/ids', controller.obtenerCanchasIdsPorClubesQuery);

export default router;

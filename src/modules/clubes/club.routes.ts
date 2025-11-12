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

// ✅ NUEVO: devolver IDs de canchas para una lista de clubes (POST con body { clubIds: [...] })
router.post('/canchas/ids', validateDto(ClubIdsDto), controller.obtenerCanchasIdsPorClubes);

// (Opcional) variante GET con query ?clubIds=uuid1,uuid2
router.get('/canchas/ids', controller.obtenerCanchasIdsPorClubesQuery);

export default router;

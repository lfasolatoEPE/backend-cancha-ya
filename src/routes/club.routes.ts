import { Router } from 'express';
import {
  crearClubHandler,
  listarClubesHandler,
  obtenerClubHandler,
  actualizarClubHandler,
  eliminarClubHandler
} from '../controllers/club.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validateDto } from '../utils/validate';
import { CrearClubDto, ActualizarClubDto } from '../dtos/club.dto';

const router = Router();

// Solo admin puede crear y borrar clubes
router.post('/', authMiddleware, authorizeRoles('admin'), validateDto(CrearClubDto), crearClubHandler);
router.get('/', listarClubesHandler);
router.get('/:id', obtenerClubHandler);
router.patch('/:id', authMiddleware, authorizeRoles('admin'), validateDto(ActualizarClubDto), actualizarClubHandler);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), eliminarClubHandler);

export default router;

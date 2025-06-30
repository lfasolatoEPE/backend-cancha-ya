import { Router } from 'express';
import {
  crearDeporteHandler,
  listarDeportesHandler,
  obtenerDeporteHandler,
  actualizarDeporteHandler,
  eliminarDeporteHandler
} from '../controllers/deporte.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validateDto } from '../utils/validate';
import { CrearDeporteDto, ActualizarDeporteDto } from '../dtos/deporte.dto';

const router = Router();

// Solo admin puede crear, actualizar y eliminar deportes
router.post('/', authMiddleware, authorizeRoles('admin'), validateDto(CrearDeporteDto), crearDeporteHandler);
router.get('/', listarDeportesHandler);
router.get('/:id', obtenerDeporteHandler);
router.patch('/:id', authMiddleware, authorizeRoles('admin'), validateDto(ActualizarDeporteDto), actualizarDeporteHandler);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), eliminarDeporteHandler);

export default router;

import { Router } from 'express';
import {
  crearDeudaHandler,
  listarDeudasHandler,
  obtenerDeudaHandler,
  actualizarDeudaHandler,
  eliminarDeudaHandler
} from '../controllers/deuda.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validateDto } from '../utils/validate';
import { CrearDeudaDto, ActualizarDeudaDto } from '../dtos/deuda.dto';

const router = Router();

// Solo admin puede gestionar deudas
router.post('/', authMiddleware, authorizeRoles('admin'), validateDto(CrearDeudaDto), crearDeudaHandler);
router.get('/', authMiddleware, authorizeRoles('admin'), listarDeudasHandler);
router.get('/:id', authMiddleware, authorizeRoles('admin'), obtenerDeudaHandler);
router.patch('/:id', authMiddleware, authorizeRoles('admin'), validateDto(ActualizarDeudaDto), actualizarDeudaHandler);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), eliminarDeudaHandler);

export default router;

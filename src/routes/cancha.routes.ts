import { Router } from 'express';
import {
  crearCanchaHandler,
  listarCanchasHandler,
  obtenerCanchaHandler,
  actualizarCanchaHandler,
  eliminarCanchaHandler
} from '../controllers/cancha.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validateDto } from '../utils/validate';
import { CrearCanchaDto, ActualizarCanchaDto } from '../dtos/cancha.dto';

const router = Router();

// Solo admin puede crear y eliminar canchas
router.post('/', authMiddleware, authorizeRoles('admin'), validateDto(CrearCanchaDto), crearCanchaHandler);
router.get('/', listarCanchasHandler);
router.get('/:id', obtenerCanchaHandler);
router.patch('/:id', authMiddleware, authorizeRoles('admin'), validateDto(ActualizarCanchaDto), actualizarCanchaHandler);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), eliminarCanchaHandler);

export default router;

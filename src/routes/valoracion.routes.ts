import { Router } from 'express';
import {
  crearValoracionHandler,
  listarValoracionesHandler,
  obtenerValoracionHandler,
  eliminarValoracionHandler
} from '../controllers/valoracion.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateDto } from '../utils/validate';
import { CrearValoracionDto } from '../dtos/valoracion.dto';

const router = Router();

// El usuario logueado puede crear valoraciones
router.post('/', authMiddleware, validateDto(CrearValoracionDto), crearValoracionHandler);

// Listar y consultar no requiere token
router.get('/', listarValoracionesHandler);
router.get('/:id', obtenerValoracionHandler);

// Solo admin puede eliminar
import { authorizeRoles } from '../middlewares/role.middleware';
router.delete('/:id', authMiddleware, authorizeRoles('admin'), eliminarValoracionHandler);

export default router;

import { Router } from 'express';
import {
  crearReservaHandler,
  confirmarReservaHandler,
  cancelarReservaHandler,
  obtenerTodasHandler,
  obtenerPorIdHandler
} from '../controllers/reserva.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validateDto } from '../utils/validate';
import { CrearReservaDto } from '../dtos/reserva.dto';

const router = Router();

router.post('/', authMiddleware, validateDto(CrearReservaDto), crearReservaHandler);
router.patch('/:id/confirmar', authMiddleware, confirmarReservaHandler);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), cancelarReservaHandler);
router.get('/', authMiddleware, obtenerTodasHandler);
router.get('/:id', authMiddleware, obtenerPorIdHandler);

export default router;

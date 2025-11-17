import { Router } from 'express';
import { ReservaController } from './reserva.controller';
import { ReservaService } from './reserva.service';
import { validateDto } from '../../utils/validate';
import { CrearReservaDto } from './dto/crear-reserva.dto';
import { ActualizarReservaDto } from './dto/actualizar-reserva.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new ReservaController(new ReservaService());

router.post('/', authMiddleware, validateDto(CrearReservaDto), controller.crearReserva);

// 🔄 NUEVO: actualizar reserva pendiente (dueño o admin)
router.patch(
  '/:id',
  authMiddleware,
  validateDto(ActualizarReservaDto),
  controller.actualizarReserva
);

router.patch('/:id/confirmar', authMiddleware, controller.confirmarReserva);
router.delete('/:id', authMiddleware, controller.cancelarReserva);
router.get('/', authMiddleware, controller.obtenerTodas);
router.get('/:id', authMiddleware, controller.obtenerPorId);

export default router;

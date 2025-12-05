import { Router } from 'express';
import { DesafioController } from './desafio.controller';
import { DesafioService } from './desafio.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateDto } from '../../utils/validate';
import { CrearDesafioDto } from './dto/crear-desafio.dto';
import { AgregarJugadoresDto } from './dto/agregar-jugadores.dto';
import { FinalizarDesafioDto } from './dto/finalizar-desafio.dto';

const router = Router();
const controller = new DesafioController(new DesafioService());

router.post('/', authMiddleware, validateDto(CrearDesafioDto), controller.crear);

// ✅ usamos al usuario logueado, no hace falta body
router.patch('/:id/aceptar', authMiddleware, controller.aceptarDesafio);

router.patch('/:id/rechazar', authMiddleware, controller.rechazarDesafio);
router.patch('/:id/cancelar', authMiddleware, controller.cancelarDesafio);
router.patch(
  '/:id/agregar-jugadores',
  authMiddleware,
  validateDto(AgregarJugadoresDto),
  controller.agregarJugadores
);
router.patch(
  '/:id/finalizar',
  authMiddleware,
  validateDto(FinalizarDesafioDto),
  controller.finalizar
);

// ✅ listar por persona logueada + filtros query
router.get('/', authMiddleware, controller.listar);

export default router;

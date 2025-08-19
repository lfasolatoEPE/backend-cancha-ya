import { Router } from 'express';
import { DesafioController } from './desafio.controller';
import { DesafioService } from './desafio.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateDto } from '../../utils/validate';
import { CrearDesafioDto } from './dto/crear-desafio.dto';
import { AceptarDesafioDto } from './dto/aceptar-desafio.dto';
import { RechazarDesafioDto } from './dto/rechazar-desafio.dto';
import { AgregarJugadoresDto } from './dto/agregar-jugadores.dto';
import { FinalizarDesafioDto } from './dto/finalizar-desafio.dto';
// import { deudaMiddleware } from '../../middlewares/deuda.middleware'; s

const router = Router();
const controller = new DesafioController(new DesafioService());

router.post('/', authMiddleware, validateDto(CrearDesafioDto), controller.crear);
router.patch('/:id/desafios/aceptar', authMiddleware, validateDto(AceptarDesafioDto), controller.aceptarDesafio);
router.patch('/:id/desafios/rechazar', authMiddleware, validateDto(RechazarDesafioDto), controller.rechazarDesafio);
router.patch('/:id/agregar-jugadores', authMiddleware, validateDto(AgregarJugadoresDto), controller.agregarJugadores);
router.patch('/:id/finalizar', authMiddleware, validateDto(FinalizarDesafioDto), controller.finalizar);
router.get('/', authMiddleware, controller.listar);

export default router;
import { Router } from 'express';
import {
  crearDesafioHandler,
  aceptarDesafioHandler,
  finalizarDesafioHandler,
  listarDesafiosHandler
} from '../controllers/desafio.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateDto } from '../utils/validate';
import { FiltroDesafioDto } from '../dtos/desafio-filtro.dto';


const router = Router();

router.post('/', authMiddleware, crearDesafioHandler);
router.patch('/:id/aceptar', authMiddleware, aceptarDesafioHandler);
router.patch('/:id/finalizar', authMiddleware, finalizarDesafioHandler);
router.get('/', authMiddleware, validateDto(FiltroDesafioDto, 'query'), listarDesafiosHandler);

export default router;

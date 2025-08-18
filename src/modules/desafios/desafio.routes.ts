import { Router } from 'express';
import { DesafioController } from './desafio.controller';
import { DesafioService } from './desafio.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateDto } from '../../utils/validate';

// DTOs
import { CrearDesafioDto } from './dto/crear-desafio.dto';
import { FiltroDesafioDto } from './dto/filtro-desafio.dto';
import { AceptarDesafioDto } from './dto/aceptar-desafio.dto';
import { FinalizarDesafioDto } from './dto/finalizar-desafio.dto';

const router = Router();
const controller = new DesafioController(new DesafioService());

router.post(
  '/',
  authMiddleware,
  validateDto(CrearDesafioDto),
  controller.crear
);

router.patch(
  '/:id/aceptar',
  authMiddleware,
  validateDto(AceptarDesafioDto),
  controller.aceptar
);

router.patch(
  '/:id/cargar-resultado',
  authMiddleware,
  validateDto(FinalizarDesafioDto),
  controller.cargarResultado
);

router.patch(
  '/:id/finalizar',
  authMiddleware,
  controller.finalizar
);

router.get(
  '/',
  authMiddleware,
  validateDto(FiltroDesafioDto, 'query'),
  controller.listar
);

export default router;

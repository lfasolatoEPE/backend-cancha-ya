import { Router } from 'express';
import {
  crearHorarioHandler,
  listarHorariosHandler,
  obtenerHorarioHandler,
  actualizarHorarioHandler,
  eliminarHorarioHandler
} from '../controllers/horario.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validateDto } from '../utils/validate';
import { CrearHorarioDto, ActualizarHorarioDto } from '../dtos/horario.dto';

const router = Router();

// Solo admin puede crear, modificar y eliminar
router.post('/', authMiddleware, authorizeRoles('admin'), validateDto(CrearHorarioDto), crearHorarioHandler);
router.get('/', listarHorariosHandler);
router.get('/:id', obtenerHorarioHandler);
router.patch('/:id', authMiddleware, authorizeRoles('admin'), validateDto(ActualizarHorarioDto), actualizarHorarioHandler);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), eliminarHorarioHandler);

export default router;

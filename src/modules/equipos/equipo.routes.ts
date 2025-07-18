import { Router } from 'express';
import { EquipoController } from './equipo.controller';
import { EquipoService } from './equipo.service';
import { validateDto } from '../../utils/validate';
import { CrearEquipoDto } from './dto/crear-equipo.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new EquipoController(new EquipoService());

router.post('/', authMiddleware, validateDto(CrearEquipoDto), controller.crear);
router.get('/', controller.listar);
router.get('/:id', controller.obtener);

export default router;

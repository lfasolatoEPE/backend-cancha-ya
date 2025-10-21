import { Router } from 'express';
import { PersonaController } from './persona.controller';
import { PersonaService } from './persona.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateDto } from '../../utils/validate';
import { ActualizarPersonaDto } from './dto/actualizar-persona.dto';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new PersonaController(new PersonaService());

router.get('/search', authMiddleware, controller.search);
router.get('/', authMiddleware, authorizeRoles('admin'), controller.listar);
router.get('/:id', authMiddleware, controller.obtener);
router.patch('/:id', authMiddleware, validateDto(ActualizarPersonaDto), controller.actualizar);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), controller.eliminar);


export default router;

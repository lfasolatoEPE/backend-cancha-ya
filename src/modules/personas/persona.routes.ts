import { Router } from 'express';
import { PersonaController } from './persona.controller';
import { PersonaService } from './persona.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateDto } from '../../utils/validate';
import { ActualizarPersonaDto } from './dto/actualizar-persona.dto';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new PersonaController(new PersonaService());

// búsqueda por texto (nombre/apellido/email)
router.get('/search', authMiddleware, controller.search);

// admin: lista completa
router.get('/', authMiddleware, authorizeRoles('admin'), controller.listar);

// owner o admin: obtener perfil
router.get('/:id', authMiddleware, controller.obtener);

// actualizar (PUT preferido) — admin u owner
router.put('/:id', authMiddleware, validateDto(ActualizarPersonaDto), controller.actualizar);

// alias PATCH (opcional, para compatibilidad)
router.patch('/:id', authMiddleware, validateDto(ActualizarPersonaDto), controller.actualizar);

// admin: eliminar persona
router.delete('/:id', authMiddleware, authorizeRoles('admin'), controller.eliminar);

export default router;

import { Router } from 'express';
import { ValoracionController } from './valoracion.controller';
import { ValoracionService } from './valoracion.service';
import { validateDto } from '../../utils/validate';
import { CrearValoracionDto } from './dto/crear-valoracion.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new ValoracionController(new ValoracionService());

// Crear: requiere token
router.post('/', authMiddleware, validateDto(CrearValoracionDto), controller.crear);

// Listar y consultar: públicos
router.get('/', controller.listar);
router.get('/:id', controller.obtener);

// Eliminar: solo admin
router.delete('/:id', authMiddleware, authorizeRoles('admin'), controller.eliminar);

export default router;

import { Router } from 'express';
import { RolController } from './rol.controller';
import { RolService } from './rol.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateDto } from '../../utils/validate';
import { CrearRolDto } from './dto/crear-rol.dto';

const router = Router();
const controller = new RolController(new RolService());

// Solo admin global maneja roles
router.use(authMiddleware, authorizeRoles('admin'));

router.get('/', controller.listar);
router.post('/', validateDto(CrearRolDto), controller.crear);

export default router;
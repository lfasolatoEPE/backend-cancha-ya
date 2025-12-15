import { Router } from 'express';
import { RolController } from './rol.controller';
import { RolService } from './rol.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeAccess } from '../../middlewares/role.middleware';
import { validateDto } from '../../utils/validate';
import { CrearRolDto } from './dto/crear-rol.dto';
import { NivelAcceso } from '../../entities/Rol.entity';

const router = Router();
const controller = new RolController(new RolService());

// Solo admin global maneja roles
router.use(authMiddleware, authorizeAccess(NivelAcceso.Admin));

router.get('/', controller.listar);
router.post('/', validateDto(CrearRolDto), controller.crear);

export default router;

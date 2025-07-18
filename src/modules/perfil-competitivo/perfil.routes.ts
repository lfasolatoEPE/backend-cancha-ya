import { Router } from 'express';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';
import { validateDto } from '../../utils/validate';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new PerfilController(new PerfilService());

router.get('/', authMiddleware, controller.obtenerMiPerfil);
router.patch('/', authMiddleware, validateDto(ActualizarPerfilDto), controller.actualizarMiPerfil);

export default router;

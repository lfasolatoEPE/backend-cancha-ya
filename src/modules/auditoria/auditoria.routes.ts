import { Router } from 'express';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new AuditoriaController(new AuditoriaService());

router.get(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  controller.listar
);

export default router;

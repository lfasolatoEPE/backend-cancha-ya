import { Router } from 'express';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new AdminController(new AdminService());

// Protección por rol admin
router.use(authMiddleware, authorizeRoles('admin'));

router.get('/resumen', controller.resumenGeneral);
router.get('/top-jugadores', controller.topJugadores);
router.get('/canchas-mas-usadas', controller.canchasMasUsadas);
router.get('/personas-con-deuda', controller.personasConDeuda);

export default router;

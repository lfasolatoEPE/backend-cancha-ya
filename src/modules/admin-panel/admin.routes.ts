// src/modules/admin/admin.routes.ts
import { Router } from 'express';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateDto } from '../../utils/validate';
import { RangeDto } from './dto/range.dto';

const router = Router();
const controller = new AdminController(new AdminService());

// Sólo admin
router.use(authMiddleware, authorizeRoles('admin'));

router.get('/resumen', controller.resumenGeneral);
router.get('/top-jugadores', controller.topJugadores);
router.get('/canchas-mas-usadas', controller.canchasMasUsadas);
router.get('/personas-con-deuda', controller.personasConDeuda);

// NUEVOS (sin class-validator)
router.get('/reservas/aggregate', controller.aggregates);
router.get('/reservas/drilldown', controller.drilldown);
router.get('/ocupacion', controller.ocupacion);
router.get('/reservas/heatmap', controller.heatmap);


export default router;

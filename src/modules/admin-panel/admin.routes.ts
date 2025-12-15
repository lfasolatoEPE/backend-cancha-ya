import { Router } from 'express';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeAccess } from '../../middlewares/role.middleware';
import { NivelAcceso } from '../../entities/Rol.entity';

const router = Router();
const controller = new AdminController(new AdminService());


router.use(authMiddleware, authorizeAccess(NivelAcceso.Admin, NivelAcceso.AdminClub));


router.get('/resumen', controller.resumenGeneral);
router.get('/top-jugadores', controller.topJugadores);
router.get('/canchas-mas-usadas', controller.canchasMasUsadas);
router.get('/personas-con-deuda', controller.personasConDeuda);

// EXISTENTES (reservas / ocupación / heatmap)
router.get('/reservas/aggregate', controller.aggregates);
router.get('/reservas/drilldown', controller.drilldown);
router.get('/ocupacion', controller.ocupacion);
router.get('/reservas/heatmap', controller.heatmap);

// NUEVOS: Tendencias para dashboard admin
router.get('/reportes/ocupacion-trend', controller.ocupacionTrend);
router.get('/reportes/revenue-trend', controller.revenueTrend);
router.get('/reportes/usuarios-trend', controller.usuariosTrend);

// NUEVO: Segmentación de usuarios (RFM simple)
router.get('/usuarios/segmentacion', controller.segmentacionUsuarios);

export default router;

import { Router } from 'express';
import { ReporteController } from './reportes.controller';
import { ReporteService } from './reportes.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';

const router = Router();
const controller = new ReporteController(new ReporteService());

router.use(authMiddleware, authorizeRoles('admin'));

router.get('/reservas', controller.exportarReservasCsv);
router.get('/deudas', controller.exportarDeudasCsv);
router.get('/ranking-jugadores', controller.exportarRankingJugadoresCsv);

export default router;

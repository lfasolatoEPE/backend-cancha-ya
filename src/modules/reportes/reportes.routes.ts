import { Router } from 'express';
import { ReporteController } from './reportes.controller';
import { ReporteService } from './reportes.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeAccess } from '../../middlewares/role.middleware';
import { NivelAcceso } from '../../entities/Rol.entity';

const router = Router();
const controller = new ReporteController(new ReporteService());

router.use(authMiddleware, authorizeAccess(NivelAcceso.Admin, NivelAcceso.AdminClub));

router.get('/reservas', controller.exportarReservasCsv);
router.get('/deudas', controller.exportarDeudasCsv);
router.get('/ranking-jugadores', controller.exportarRankingJugadoresCsv);

export default router;

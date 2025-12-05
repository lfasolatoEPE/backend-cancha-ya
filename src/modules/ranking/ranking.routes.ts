// src/modules/ranking/ranking.routes.ts
import { Router } from 'express';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new RankingController(new RankingService());

router.get('/', authMiddleware, controller.obtenerRankingGeneral);
router.get('/usuario/:usuarioId', authMiddleware, controller.obtenerPerfilDeUsuario);
// 🔹 NUEVO: perfil competitivo del usuario logueado
router.get('/me', authMiddleware, controller.obtenerMiPerfil);

export default router;

import { Router } from 'express';
import {
  activarModoCompetitivo,
  desactivarModoCompetitivo,
  obtenerMiRanking,
  rankingGlobal
} from '../controllers/competitivo.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/activar', authMiddleware, activarModoCompetitivo);
router.post('/desactivar', authMiddleware, desactivarModoCompetitivo);
router.get('/mi-ranking', authMiddleware, obtenerMiRanking);
router.get('/ranking', authMiddleware, rankingGlobal);

export default router;

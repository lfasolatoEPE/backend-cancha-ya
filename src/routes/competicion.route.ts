import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listarRankingJugadoresHandler } from '../controllers/competicion.controller';

const router = Router();

router.get('/jugadores-ranking', authMiddleware, listarRankingJugadoresHandler);

export default router;

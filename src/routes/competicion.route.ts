import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rankingJugadoresHandler } from "../controllers/competicion.controller";
import { rankingEquiposHandler } from "../controllers/competicion.controller";

const router = Router();

router.get("/jugadores-ranking", authMiddleware, rankingJugadoresHandler);
router.get("/equipos-ranking", authMiddleware, rankingEquiposHandler);

export default router;

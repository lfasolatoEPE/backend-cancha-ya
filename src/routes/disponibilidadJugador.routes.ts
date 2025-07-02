import { Router } from "express";
import * as controller from "../controllers/disponibilidadJugador.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware); // todo requiere login

router.post("/", controller.crear);
// {
//   "fechaDesde": "2024-08-01",
//   "fechaHasta": "2024-08-10",
//   "horaDesde": "18:00",
//   "horaHasta": "21:00",
//   "clubesIds": [
//     "uuid-del-club-1",
//     "uuid-del-club-2"
//   ]
// }
router.get("/", controller.listar);
router.delete("/:id", controller.eliminar);

export default router;

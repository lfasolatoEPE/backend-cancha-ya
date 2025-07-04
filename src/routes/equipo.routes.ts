import { Router } from "express";
import {
  crearEquipoHandler,
  listarEquiposHandler,
  obtenerEquipoHandler,
  actualizarEquipoHandler,
  eliminarEquipoHandler
} from "../controllers/equipo.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateDto } from "../utils/validate";
import { CrearEquipoDto, ActualizarEquipoDto } from "../dtos/equipo.dto";

const router = Router();

router.get("/", authMiddleware, listarEquiposHandler);
router.get("/:id", authMiddleware, obtenerEquipoHandler);
router.post("/", authMiddleware, validateDto(CrearEquipoDto), crearEquipoHandler);
router.put("/:id", authMiddleware, validateDto(ActualizarEquipoDto), actualizarEquipoHandler);
router.delete("/:id", authMiddleware, eliminarEquipoHandler);

export default router;

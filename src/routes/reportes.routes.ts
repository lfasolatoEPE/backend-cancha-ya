import { Router } from "express";
import * as controller from "../controllers/reportes.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";

const router = Router();

/**
 * Todos los endpoints GET, protegidos por autenticación y rol admin
 */
router.get("/reservas", authMiddleware, authorizeRoles("admin"), controller.reservasPorFechas);
router.get("/ingresos", authMiddleware, authorizeRoles("admin"), controller.ingresosPorClub);
router.get("/canchas-top", authMiddleware, authorizeRoles("admin"), controller.canchasMasReservadas);
router.get("/usuarios-top", authMiddleware, authorizeRoles("admin"), controller.usuariosMasActivos);
router.get("/ocupacion-horarios", authMiddleware, authorizeRoles("admin"), controller.ocupacionPorHorario);

export default router;

import { Router } from "express";
import * as controller from "../controllers/reportes.controller";

const router = Router();

/**
 * Todos los endpoints GET
 */
router.get("/reservas", controller.reservasPorFechas);
router.get("/ingresos", controller.ingresosPorClub);
router.get("/canchas-top", controller.canchasMasReservadas);
router.get("/usuarios-top", controller.usuariosMasActivos);
router.get("/ocupacion-horarios", controller.ocupacionPorHorario);

export default router;

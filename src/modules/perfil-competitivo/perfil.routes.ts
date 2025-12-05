// src/modules/perfil-competitivo/perfil.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateDto } from '../../utils/validate';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

const router = Router();
const controller = new PerfilController(new PerfilService());

// GET /api/perfil-competitivo
router.get('/', authMiddleware, controller.obtenerMiPerfil);

// GET /api/perfil-competitivo/historial
router.get('/historial', authMiddleware, controller.obtenerMiHistorialElo);

// PATCH /api/perfil-competitivo
router.patch('/', authMiddleware, validateDto(ActualizarPerfilDto), controller.actualizarMiPerfil);

export default router;

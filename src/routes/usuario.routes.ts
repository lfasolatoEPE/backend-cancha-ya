import { Router } from 'express';
import { registrarUsuario, obtenerUsuarios } from '../controllers/usuario.controller';

const router = Router();

router.post('/registro', registrarUsuario);
router.get('/', obtenerUsuarios);

export default router;
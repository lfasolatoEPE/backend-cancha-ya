import { Router } from 'express';
import { registrarUsuario, obtenerUsuarios, actualizarUsuarioHandler } from '../controllers/usuario.controller';
import { validateDto } from '../utils/validate';
import { CrearUsuarioDto } from '../dtos/usuario.dto';
import { ActualizarUsuarioDto } from '../dtos/usuario-update.dto';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/registro', validateDto(CrearUsuarioDto), registrarUsuario);
router.post('/admin', validateDto(CrearUsuarioDto), registrarUsuario);
// {
//   "nombre": "",
//   "email": "noesunemail",
//   "password": "123"
// }
// devuelve
// {
//   "errores": [
//     "El nombre es obligatorio",
//     "El email no es válido",
//     "La contraseña debe tener al menos 6 caracteres"
//   ]
// }
router.get('/', authMiddleware, obtenerUsuarios);
router.patch('/:id', authMiddleware, validateDto(ActualizarUsuarioDto), actualizarUsuarioHandler);

export default router;

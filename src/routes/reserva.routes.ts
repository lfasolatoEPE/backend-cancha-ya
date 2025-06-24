import { Router } from 'express';
import { crearReserva, confirmarAsistencia, cancelarReserva } from '../controllers/reserva.controller';

const router = Router();

router.post('/', crearReserva);
router.post('/confirmar/:id', confirmarAsistencia);
router.post('/cancelar/:id', cancelarReserva);

export default router;

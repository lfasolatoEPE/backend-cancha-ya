import { Router } from 'express';
import { crearReserva } from '../controllers/reserva.controller';

const router = Router();

router.post('/', crearReserva);

export default router;

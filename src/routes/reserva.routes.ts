import { Router } from 'express';
import { reservarCancha } from '../controllers/reserva.controller';

const router = Router();

router.post('/', reservarCancha);

export default router;

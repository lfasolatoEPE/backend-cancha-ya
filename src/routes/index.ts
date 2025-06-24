import { Router } from 'express';
import reservaRoutes from './reserva.routes';
import usuarioRoutes from './usuario.routes';
// import canchaRoutes from './cancha.routes';

const router = Router();

router.use('/reservas', reservaRoutes);
router.use('/usuarios', usuarioRoutes);
// router.use('/canchas', canchaRoutes);

export default router;
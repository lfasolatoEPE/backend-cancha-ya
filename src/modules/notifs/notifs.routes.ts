import { Router } from 'express';
import { NotifsController } from './notifs.controller';
import { NotifsService } from './notifs.service';
import { AppDataSource } from '../../database/data-source';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new NotifsController(new NotifsService(AppDataSource));

const guardNotifs = (_req: any, res: any, next: any) => {
  if (process.env.NOTIFS_ENABLED !== 'true') {
    return res.status(503).json({ message: 'Notificaciones deshabilitadas' });
  }
  next();
};

router.post('/subscribe', authMiddleware, guardNotifs, controller.subscribe);
router.post('/test/email', authMiddleware, guardNotifs, controller.testEmail);

export default router;

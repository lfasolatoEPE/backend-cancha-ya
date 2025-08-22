import { Router } from 'express';
import { NotifsController } from './notifs.controller';
import { NotifsService } from './notifs.service';
import { AppDataSource } from '../../database/data-source';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { notifQueue } from './queue';

const router = Router();
const controller = new NotifsController(new NotifsService(AppDataSource));

router.post('/subscribe', authMiddleware, controller.subscribe);
router.post('/test/email', authMiddleware, controller.testEmail);
router.get('/admin/queue-counts', authMiddleware, async (_req, res) => {
  const counts = await notifQueue.getJobCounts();
  res.json(counts);
});
router.post('/admin/queue-ping', authMiddleware, async (_req, res) => {
  await notifQueue.add('ping', { at: new Date().toISOString() });
  res.json({ ok: true });
});
export default router;

// - Crea cola y worker de notifs:
//   - queue.ts con ioredis (TLS rediss://, SNI, IPv4, timeouts, retryStrategy)
//   - events.ts (nombres de jobs)
//   - worker.ts con procesadores: send-mail y reserva-recordatorio (usa tplReservaRecordatorio)
//   - logs detallados: enqueue, active, completed, failed, stalled
// - NotifsService: sendEmailToUser (encola), scheduleReservaReminder (delayed jobs), _sendNow
// - Rutas + controlador:
//   - POST /api/notifs/subscribe (auth)
//   - POST /api/notifs/test/email (auth)
//   - GET  /api/notifs/admin/queue-counts (auth)
//   - POST /api/notifs/admin/queue-ping (auth)
// - EmailService refactor:
//   - método estático send({to,subject,html,text})
//   - nodemailer con MAIL_*; fallback a consola si no hay MAIL_HOST
//   - integración con templates (tplReservaCreada / tplReservaRecordatorio)

// feat(reservas): hook de notificaciones en confirmarReserva
// - Envía correo de “reserva creada” con tplReservaCreada
// - Agenda recordatorios 24h y 1h antes (BullMQ delayed)
// - Fallback: si no hay Usuario vinculado, envía directo a persona.email sin schedule

// feat(entities): agrega NotificationSubscription.entity y NotificationLog.entity
// - Auto-discovery *.entity.ts (manteniendo synchronize para dev)

// chore(scripts): agrega dev, dev:worker, dev:both, seed:notifs
// - scripts/seed-notifs.ts para probar envío + recordatorios cercanos
// - package.json: concurrently, ts-node

// chore(deps): instala bullmq, ioredis, nodemailer, zod, luxon
// - devDeps: @types/nodemailer, concurrently, ts-node, typescript

// chore(config): dotenv primero en queue/worker; PORT desde env; TZ=America/Argentina/Cordoba
// - logs de conexión: [REDIS] connecting to rediss://<host>:<port>

// docs: ejemplo de .env con REDIS_URL (Upstash rediss://) y MAIL_*
// Refs: deploy en Railway (servicio web + servicio worker)
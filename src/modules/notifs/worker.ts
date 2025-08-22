import 'dotenv/config';
import { makeWorker } from './queue';
import { JOB_SEND_MAIL, JOB_RESERVA_RECORDATORIO } from './events';
import { AppDataSource } from '../../database/data-source';
import { NotifsService } from './notifs.service';
import { tplReservaRecordatorio } from '../../templates/reserva-recordatorio';
import { DateTime } from 'luxon';

async function bootstrap() {
  try { await AppDataSource.initialize(); } catch {}
  const svc = new NotifsService(AppDataSource);

  makeWorker(async (job) => {
    switch (job.name) {
      case JOB_SEND_MAIL: {
        const { to, subject, html, text } = job.data as any;
        await svc._sendNow(to, subject, html, text);
        return 'ok';
      }
      case JOB_RESERVA_RECORDATORIO: {
        const { userId, payload } = job.data as { userId: string; payload: { fechaISO: string; club: string; cancha: string } };
        const fechaHumana = DateTime.fromISO(payload.fechaISO, { zone: 'America/Argentina/Cordoba' })
          .toFormat("cccc dd 'de' LLLL 'a las' HH:mm");
        const tpl = tplReservaRecordatorio({ fechaHumana, club: payload.club, cancha: payload.cancha });
        await svc.sendEmailToUser(userId, tpl.subject, tpl.html, tpl.text);
        return 'reminder-sent';
      }
      default:
        throw new Error('Unknown job ' + job.name);
    }
  });

  console.log('[worker] Notificaciones escuchando cola…');
}
bootstrap();

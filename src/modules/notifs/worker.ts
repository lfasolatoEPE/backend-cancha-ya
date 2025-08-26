import 'dotenv/config';
import { makeWorker } from './queue';
import { JOB_SEND_MAIL, JOB_RESERVA_RECORDATORIO } from './events';
import { EmailService } from '../../providers/email.service';
import type { Job } from 'bullmq'; // 👈 tipos

async function bootstrap() {
  if (process.env.NOTIFS_ENABLED !== 'true') {
    console.log('[WORKER] NOTIFS_ENABLED != true → worker no se inicia');
    setInterval(() => {}, 1 << 30);
    return;
  }

  const worker = makeWorker(async (job) => {
    switch (job.name) {
      case JOB_SEND_MAIL: {
        const { to, subject, html, text } = job.data as { to: string; subject: string; html: string; text?: string };
        await EmailService.send({ to, subject, html, text });
        return 'ok';
      }
      case JOB_RESERVA_RECORDATORIO: {
        const { userId, payload } = job.data as { userId: string; payload: any };
        await EmailService.send({
          to: payload.to ?? 'dev@local.test',
          subject: `Recordatorio reserva - ${payload.club}`,
          html: `<p>Tenés reserva en ${payload.club} - cancha ${payload.cancha} - ${payload.fechaISO}</p>`,
          text: `Reserva ${payload.club} - cancha ${payload.cancha} - ${payload.fechaISO}`,
        });
        return 'ok';
      }
      default:
        console.warn('[WORKER] job desconocido', job.name);
        return 'ignored';
    }
  });

  if (!worker) return;

  worker.on('ready', () => console.log('[WORKER] Ready'));
  worker.on('active', (job: Job) =>
    console.log('[WORKER] Active →', job.name, job.id)
  );
  worker.on('completed', (job: Job, res: unknown) =>
    console.log('[WORKER] Completed →', job.name, job.id, 'result:', res)
  );
  worker.on('failed', (job: Job | undefined, err: Error) =>
    console.error('[WORKER] Failed →', job?.name, job?.id, err)
  );
}

bootstrap().catch((e) => {
  console.error('[WORKER] fatal', e);
  process.exit(1);
});

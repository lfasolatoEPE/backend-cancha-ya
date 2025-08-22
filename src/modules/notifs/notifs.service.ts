import { DataSource } from 'typeorm';
import { NotificationSubscription } from '../../entities/NotificationSubscription.entity';
import { NotificationLog } from '../../entities/NotificationLog.entity';
import { enqueue } from './queue';
import { JOB_SEND_MAIL, JOB_RESERVA_RECORDATORIO } from './events';
import { EmailService } from '../../providers/email.service';
import { DateTime } from 'luxon';

export class NotifsService {
  constructor(private readonly ds: DataSource) {}

  async subscribe(userId: string, channel: 'email' | 'push', address: string) {
    const repo = this.ds.getRepository(NotificationSubscription);
    let sub = await repo.findOne({ where: { user: { id: userId } as any, channel, address } });
    if (!sub) sub = repo.create({ user: { id: userId } as any, channel, address, enabled: true });
    else sub.enabled = true;
    return await repo.save(sub);
  }

  async sendEmailToUser(userId: string, subject: string, html: string, text?: string) {
    const subs = await this.ds.getRepository(NotificationSubscription).find({
      where: { user: { id: userId } as any, channel: 'email', enabled: true },
    });

    for (const s of subs) {
      await enqueue(
        JOB_SEND_MAIL,
        { to: s.address, subject, html, text },
        { attempts: 5, backoff: { type: 'exponential', delay: 5000 } }
      );
      await this.log('custom', userId, { to: s.address, subject });
    }
  }

  async scheduleReservaReminder(
    userId: string,
    payload: { fechaISO: string; club: string; cancha: string; reservaId: string },
    runAtISO: string
  ) {
    const runAt = DateTime.fromISO(runAtISO, { zone: 'America/Argentina/Cordoba' }).toUTC();
    const delayMs = Math.max(0, runAt.toMillis() - DateTime.utc().toMillis());
    await enqueue(
      JOB_RESERVA_RECORDATORIO,
      { userId, payload },
      { delay: delayMs, attempts: 5, backoff: { type: 'exponential', delay: 5000 } }
    );
  }

  // usado por el worker para envío inmediato (sin pasar por cola)
  async _sendNow(to: string, subject: string, html: string, text?: string) {
    await EmailService.send({ to, subject, html, text });
  }

  private async log(
    kind: NotificationLog['kind'],
    userId: string,
    payload: any,
    status: NotificationLog['status'] = 'SENT'
  ) {
    const repo = this.ds.getRepository(NotificationLog);
    await repo.save(repo.create({ kind, userId, payload, status }));
  }
}

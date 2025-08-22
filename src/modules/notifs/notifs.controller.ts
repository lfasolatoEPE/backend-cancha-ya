import { RequestHandler } from 'express';
import { NotifsService } from './notifs.service';
import { DateTime } from 'luxon';
import { tplReservaCreada } from '../../templates/reserva-creada';

export class NotifsController {
  constructor(private readonly svc: NotifsService) {}

  // POST /api/notifs/subscribe
  subscribe: RequestHandler = async (req, res, next) => {
    try {
      const { channel, address } = req.body as { channel?: 'email' | 'push'; address?: string };
      if (!channel || !address) {
        res.status(400).json({ message: 'channel y address son requeridos' });
        return;
      }
      const me = (req as any).user?.id;
      if (!me) {
        res.status(401).json({ message: 'auth requerido' });
        return;
      }
      const sub = await this.svc.subscribe(me, channel, address);
      res.status(201).json(sub);
    } catch (err) {
      next(err);
    }
  };

  // POST /api/notifs/test/email
  testEmail: RequestHandler = async (req, res, next) => {
    try {
      const me = (req as any).user?.id;
      if (!me) {
        res.status(401).json({ message: 'auth requerido' });
        return;
      }
      const fechaHumana = DateTime.now()
        .setZone('America/Argentina/Cordoba')
        .toFormat("cccc dd 'de' LLLL 'a las' HH:mm");

      const tpl = tplReservaCreada({ fechaHumana, club: 'Club Demo', cancha: '1' });
      await this.svc.sendEmailToUser(me, tpl.subject, tpl.html, tpl.text);

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  };
}

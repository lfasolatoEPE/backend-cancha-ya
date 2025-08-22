import 'dotenv/config';
import { AppDataSource } from '../../src/database/data-source';
import { NotificationSubscription } from '../entities/NotificationSubscription.entity';
import { Usuario } from '../../src/entities/Usuario.entity';
import { NotifsService } from '../../src/modules/notifs/notifs.service';
import { tplReservaCreada } from '../../src/templates/reserva-creada';
import { DateTime } from 'luxon';

async function main() {
  await AppDataSource.initialize();
  const ds = AppDataSource;

  // 1) Elegimos un usuario con persona asociada (para obtener email)
  const user = await ds.getRepository(Usuario).findOne({
    where: {},
    relations: ['persona'],
  });

  if (!user) {
    throw new Error('No hay usuarios en la base. Creá al menos 1 usuario con persona y email.');
  }
  const email = user.persona?.email;
  if (!email) {
    throw new Error(`El usuario ${user.id} no tiene persona.email. Asigná un email y reintenta.`);
  }

  // 2) Suscripción de email (si no existía)
  const subRepo = ds.getRepository(NotificationSubscription);
  let sub = await subRepo.findOne({ where: { user: { id: user.id } as any, channel: 'email', address: email } });
  if (!sub) {
    sub = subRepo.create({ user: { id: user.id } as any, channel: 'email', address: email, enabled: true });
    await subRepo.save(sub);
  }

  // 3) Envío "Reserva creada" y recordatorios cerca en el tiempo (para verlos hoy)
  const notifs = new NotifsService(ds);

  const ahoraAR = DateTime.now().setZone('America/Argentina/Cordoba');
  const inicio = ahoraAR.plus({ minutes: 10 }); // supuesta reserva dentro de 10 min
  const fechaHumana = inicio.toFormat("cccc dd 'de' LLLL 'a las' HH:mm");
  const club = 'Club Seed';
  const cancha = '1';

  // mail inmediato
  const tpl = tplReservaCreada({ fechaHumana, club, cancha });
  await notifs.sendEmailToUser(user.id, tpl.subject, tpl.html, tpl.text);

  // recordatorio a 5 min (llega en ~5 min) y a 1 min
  await notifs.scheduleReservaReminder(
    user.id,
    { reservaId: 'seed-1', fechaISO: inicio.toISO()!, club, cancha },
    inicio.minus({ minutes: 5 }).toISO()!
  );
  await notifs.scheduleReservaReminder(
    user.id,
    { reservaId: 'seed-2', fechaISO: inicio.toISO()!, club, cancha },
    inicio.minus({ minutes: 1 }).toISO()!
  );

  console.log('✅ Seed notifs listo:', { userId: user.id, email });
  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

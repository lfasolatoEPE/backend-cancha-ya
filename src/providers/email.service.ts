import nodemailer from 'nodemailer';
import { Desafio } from '../entities/Desafio.entity';
import { Persona } from '../entities/Persona.entity';

// ───── Utils ENV (prioriza MAIL_* y cae a SMTP_*) ─────
function env(...keys: string[]) {
  for (const k of keys) if (process.env[k]) return process.env[k]!;
  return undefined;
}
const HOST = env('MAIL_HOST', 'SMTP_HOST');
const PORT = Number(env('MAIL_PORT', 'SMTP_PORT') ?? '587');
const USER = env('MAIL_USER', 'SMTP_USER');
const PASS = env('MAIL_PASS', 'SMTP_PASS');
const FROM =
  env('MAIL_FROM', 'SMTP_FROM', 'MAIL_USER', 'SMTP_USER') ?? 'no-reply@canchaya.com';
const SECURE = PORT === 465;

export type MailInput = { to: string; subject: string; html: string; text?: string };

// Transport re-utilizable
class _Mailer {
  transporter: nodemailer.Transporter | null;
  constructor() {
    this.transporter = HOST
      ? nodemailer.createTransport({
          host: HOST,
          port: PORT,
          secure: SECURE,
          auth: USER ? { user: USER, pass: PASS } : undefined,
        })
      : null;
  }
  async send(input: MailInput) {
    if (!this.transporter) {
      // Dev: sin SMTP se imprime el contenido
      console.log('[MAIL LOG]', { from: FROM, ...input });
      return;
    }
    await this.transporter.sendMail({ from: FROM, ...input });
  }
  async sendBulk(items: MailInput[]) {
    for (const it of items) await this.send(it);
  }
}
const Mailer = new _Mailer();

/**
 * Servicio de email. Mantiene métodos estáticos para no romper imports existentes.
 * Para reservas, seguí usando los templates en src/templates (los consume tu módulo de notifs).
 * Acá resolvemos SOLO los correos de DESAFÍOS.
 */
export class EmailService {
  static async send(input: MailInput) {
    await Mailer.send(input);
  }
  static async sendBulk(items: MailInput[]) {
    await Mailer.sendBulk(items);
  }

  /** Invitaciones de desafío a múltiples personas */
  static async enviarInvitacionesDesafio(desafio: Desafio, invitados: Persona[]) {
    const cancha = desafio?.reserva?.disponibilidad?.cancha?.nombre ?? 'Cancha';
    const fecha = desafio?.reserva?.fechaHora ? new Date(desafio.reserva.fechaHora) : null;
    const fechaDia = fecha ? fecha.toLocaleDateString() : 'Fecha';
    const horaIni = desafio?.reserva?.disponibilidad?.horario?.horaInicio ?? '—';
    const horaFin = desafio?.reserva?.disponibilidad?.horario?.horaFin ?? '—';
    const creadorNombre = `${desafio?.creador?.nombre ?? ''} ${desafio?.creador?.apellido ?? ''}`.trim();

    const subject = `⚽ Fuiste invitado a un desafío en CanchaYA`;

    const mkText = (inv: Persona) => `
Hola ${inv.nombre ?? ''} 👋,

Fuiste invitado a un desafío en la cancha "${cancha}".

🧑‍💼 Creador: ${creadorNombre || '—'}
📅 Día: ${fechaDia}
🕒 Hora: ${horaIni} - ${horaFin}
🏟️ Cancha: ${cancha}

Ingresá a la app para aceptar o rechazar el desafío.

¡Suerte!
Equipo CanchaYA`.trim();

    const mkHtml = (inv: Persona) => `
<div>
  <p>Hola ${inv.nombre ?? ''} 👋,</p>
  <p>Fuiste invitado a un desafío en la cancha "<b>${cancha}</b>".</p>
  <ul>
    <li>🧑‍💼 <b>Creador:</b> ${creadorNombre || '—'}</li>
    <li>📅 <b>Día:</b> ${fechaDia}</li>
    <li>🕒 <b>Hora:</b> ${horaIni} - ${horaFin}</li>
    <li>🏟️ <b>Cancha:</b> ${cancha}</li>
  </ul>
  <p>Ingresá a la app para aceptar o rechazar el desafío.</p>
  <p>¡Suerte!<br/>Equipo CanchaYA</p>
</div>`.trim();

    const items = (invitados ?? [])
      .filter((i) => !!i?.email)
      .map((i) => ({ to: i.email!, subject, text: mkText(i), html: mkHtml(i) }));

    if (!items.length) {
      console.warn('⚠️ No hay invitados con email válido para enviar.');
      return;
    }
    await Mailer.sendBulk(items);
    console.log('📨 Invitaciones enviadas:', items.length);
  }

  /** Aviso al creador cuando un invitado acepta */
  static async enviarAceptacionDesafio(desafio: Desafio, invitado: Persona) {
    const to = desafio?.creador?.email;
    if (!to) {
      console.warn('⚠️ Desafío sin email del creador. No se envía aceptación.');
      return;
    }
    const cancha = desafio?.reserva?.disponibilidad?.cancha?.nombre ?? 'Cancha';

    const subject = `✅ ${invitado.nombre} aceptó el desafío`;
    const text = `
Hola ${desafio.creador?.nombre ?? ''},

El jugador ${invitado.nombre} ${invitado.apellido ?? ''} aceptó el desafío en la cancha "${cancha}".

Podés ver más detalles en la plataforma.

¡A prepararse para el partido!
Equipo CanchaYA`.trim();

    const html = `
<div>
  <p>Hola ${desafio.creador?.nombre ?? ''},</p>
  <p>El jugador <b>${invitado.nombre} ${invitado.apellido ?? ''}</b> aceptó el desafío en la cancha "<b>${cancha}</b>".</p>
  <p>Podés ver más detalles en la plataforma.</p>
  <p>¡A prepararse para el partido!<br/>Equipo CanchaYA</p>
</div>`.trim();

    await Mailer.send({ to, subject, text, html });
    console.log(`✅ Mail de aceptación enviado a ${to}`);
  }
}

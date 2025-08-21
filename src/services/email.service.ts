// src/services/EmailService.ts
import { Desafio } from '../entities/Desafio.entity';
import { Persona } from '../entities/Persona.entity';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const from = process.env.MAIL_FROM || process.env.MAIL_USER || 'no-reply@canchaya.com';

export class EmailService {
  static async enviarInvitacionesDesafio(desafio: Desafio, invitados: Persona[]) {
    console.log('📬 Enviando invitaciones reales por mail...');

    const asunto = `⚽ Fuiste invitado a un desafío en CanchaYA`;
    const cuerpo = `
      Hola 👋,

      Fuiste invitado a un desafío en la cancha "${desafio.reserva.disponibilidad.cancha.nombre}".

      🧑‍💼 Creador: ${desafio.creador?.nombre} ${desafio.creador?.apellido}
      📅 Día: ${desafio.reserva.fechaHora.toLocaleDateString()}
      🕒 Hora: ${desafio.reserva.disponibilidad.horario.horaInicio} - ${desafio.reserva.disponibilidad.horario.horaFin}
      🏟️ Cancha: ${desafio.reserva.disponibilidad.cancha.nombre}
      
      Iniciá sesión en la app para aceptar o rechazar el desafío.

      ¡Suerte!
      Equipo CanchaYA
    `;

    console.log('🔍 Invitados recibidos para enviar email:', invitados);
    console.log('📬 Total de invitados:', invitados.length);

    // for (const invitado of invitados) {
    //   try {
    //     await transporter.sendMail({
    //       from,
    //       to: invitado.email,
    //       subject: asunto,
    //       text: cuerpo,
    //     });
    //     console.log(`✅ Mail enviado a ${invitado.email}`);
    //   } catch (error) {
    //     console.error(`❌ Error al enviar mail a ${invitado.email}:`, error);
    //   }
    // }

    console.log('📨 Todos los mails de invitación fueron procesados');
  }

  static async enviarAceptacionDesafio(desafio: Desafio, invitado: Persona) {
    try {
      const asunto = `✅ ${invitado.nombre} aceptó el desafío`;
      const cuerpo = `
        Hola ${desafio.creador?.nombre},

        El jugador ${invitado.nombre} ${invitado.apellido} aceptó el desafío en la cancha "${desafio.reserva.disponibilidad.cancha.nombre}".

        Podés ver más detalles en la plataforma.

        ¡A prepararse para el partido!
        Equipo CanchaYA
      `;

      await transporter.sendMail({
        from,
        to: desafio.creador.email,
        subject: asunto,
        text: cuerpo,
      });

      console.log(`✅ Mail de aceptación enviado a ${desafio.creador.email}`);
    } catch (error) {
      console.error(`❌ Error al enviar mail de aceptación:`, error);
    }
  }
}

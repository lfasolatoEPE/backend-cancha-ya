// src/scripts/test-mail.ts
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

// const transporter = nodemailer.createTransport({
//   host: process.env.MAIL_HOST,
//   port: 465,
//   secure: true, // ✅ importante: true para SSL
//   auth: {
//     user: process.env.MAIL_USER,
//     pass: process.env.MAIL_PASS,
//   },
// });

transporter.sendMail({
  from: process.env.MAIL_FROM,
  to: 'lfasolato.epe@gmail.com', // <-- poné tu mail real
  subject: '🧪 Test desde CanchaYA',
  text: 'Si recibís este correo, todo funciona correctamente.',
})
.then(() => {
  console.log('✅ Mail de prueba enviado correctamente');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Error enviando mail de prueba:', err);
  process.exit(1);
});

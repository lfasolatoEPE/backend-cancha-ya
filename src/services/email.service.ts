// Stub de notificaciones por mail. Integrá nodemailer/mercadopago mail sender o lo que uses.
import { Desafio } from '../entities/Desafio.entity';
import { Persona } from '../entities/Persona.entity';
export class EmailService {
static async enviarInvitacionesDesafio(desafio: Desafio, invitados: Persona[]) {
// TODO: implementar real. Por ahora solo loguea.
console.log(`[MAIL] Invitaciones enviadas para desafío ${desafio.id} a:`, invitados.map(i => i.email));
}
static async enviarAceptacionDesafio(desafio: Desafio, invitado: Persona) {
console.log(`[MAIL] ${invitado.nombre} aceptó el desafío ${desafio.id}. Notificar a ${desafio.creador.email}`);
}
}
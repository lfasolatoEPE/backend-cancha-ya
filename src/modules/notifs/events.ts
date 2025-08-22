export type DomainEvent =
  | { type: 'reserva.creada'; data: { reservaId: string; userId: string; fechaISO: string; club: string; cancha: string } }
  | { type: 'reserva.recordatorio'; data: { reservaId: string; userId: string; fechaISO: string; club: string; cancha: string } };

export const QUEUE_NOTIFS = 'notifications';
export const JOB_SEND_MAIL = 'send-mail';
export const JOB_RESERVA_RECORDATORIO = 'reserva-recordatorio';

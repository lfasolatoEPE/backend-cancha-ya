import { Reserva } from '../../../entities/Reserva.entity';
import { ReservaState } from './reserva-state';

export class ConfirmadaState implements ReservaState {
  confirmar(_reserva: Reserva): void {
    throw new Error('La reserva ya está confirmada');
  }

  cancelar(reserva: Reserva): void {
    // Permitimos pasar de confirmada → cancelada (como ya hacías en el servicio)
    reserva.estado = 'cancelada' as any; // o usar EstadoReserva.Cancelada si lo importás
  }
}

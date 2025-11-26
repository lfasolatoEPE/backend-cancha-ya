import { Reserva, EstadoReserva } from '../../../entities/Reserva.entity';
import { ReservaState } from './reserva-state';

export class PendienteState implements ReservaState {
  confirmar(reserva: Reserva): void {
    reserva.estado = EstadoReserva.Confirmada;
  }

  cancelar(reserva: Reserva): void {
    reserva.estado = EstadoReserva.Cancelada;
  }
}

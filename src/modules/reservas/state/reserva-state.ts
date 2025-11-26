import { Reserva } from '../../../entities/Reserva.entity';

export interface ReservaState {
  confirmar(reserva: Reserva): void;
  cancelar(reserva: Reserva): void;
}

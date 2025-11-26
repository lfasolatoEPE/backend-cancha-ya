import { Reserva } from '../../../entities/Reserva.entity';
import { ReservaState } from './reserva-state';

export class CanceladaState implements ReservaState {
  confirmar(_reserva: Reserva): void {
    throw new Error('No se puede confirmar una reserva cancelada');
  }

  cancelar(_reserva: Reserva): void {
    // ya está cancelada, no hace nada
  }
}

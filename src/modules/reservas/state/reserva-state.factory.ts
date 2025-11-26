import { Reserva, EstadoReserva } from '../../../entities/Reserva.entity';
import { ReservaState } from './reserva-state';
import { PendienteState } from './pendiente.state';
import { ConfirmadaState } from './confirmada.state';
import { CanceladaState } from './cancelada.state';

export function crearStateParaReserva(reserva: Reserva): ReservaState {
  switch (reserva.estado) {
    case EstadoReserva.Pendiente:
      return new PendienteState();
    case EstadoReserva.Confirmada:
      return new ConfirmadaState();
    case EstadoReserva.Cancelada:
      return new CanceladaState();
    default:
      // fallback defensivo
      return new PendienteState();
  }
}

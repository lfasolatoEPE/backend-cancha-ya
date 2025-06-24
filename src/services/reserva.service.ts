interface ReservaPayload {
  usuarioId: string;
  canchaId: string;
  fecha: string;
}

const reservas: any[] = []; // temporal

export const procesarReserva = (data: ReservaPayload) => {
  if (!data.usuarioId || !data.canchaId || !data.fecha) {
    throw new Error('Faltan datos requeridos');
  }

  const tieneDeuda = false; // simulación

  if (tieneDeuda) {
    throw new Error('El usuario tiene deuda');
  }

  const nuevaReserva = {
    id: reservas.length + 1,
    ...data,
    confirmada: false
  };

  reservas.push(nuevaReserva);
  return nuevaReserva;
};

export const procesarConfirmacion = (id: string) => {
  const reserva = reservas.find(r => r.id === Number(id));
  if (!reserva) throw new Error('Reserva no encontrada');
  reserva.confirmada = true;
  return { mensaje: 'Reserva confirmada', reserva };
};

export const procesarCancelacion = (id: string) => {
  const index = reservas.findIndex(r => r.id === Number(id));
  if (index === -1) throw new Error('Reserva no encontrada');
  reservas.splice(index, 1);
  return { mensaje: 'Reserva cancelada' };
};

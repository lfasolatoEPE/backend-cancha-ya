export const procesarReserva = (data: any) => {
  const { usuarioId, canchaId, fecha } = data;

  const tieneDeuda = false; // lógica simulada

  if (tieneDeuda) {
    throw new Error('Usuario con deuda');
  }

  return {
    mensaje: 'Reserva exitosa',
    canchaId,
    fecha
  };
};

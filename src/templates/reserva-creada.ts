export function tplReservaCreada(p: { fechaHumana: string; club: string; cancha: string }) {
  return {
    subject: `Reserva confirmada - ${p.club}`,
    html: `<h2>¡Tu reserva está confirmada!</h2>
           <p><b>Fecha:</b> ${p.fechaHumana}</p>
           <p><b>Club:</b> ${p.club}</p>
           <p><b>Cancha:</b> ${p.cancha}</p>`,
    text: `Reserva confirmada - ${p.club} - ${p.fechaHumana} - Cancha ${p.cancha}`,
  };
}

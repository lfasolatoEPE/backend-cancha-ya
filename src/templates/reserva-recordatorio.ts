export function tplReservaRecordatorio(p: { fechaHumana: string; club: string; cancha: string }) {
  return {
    subject: `Recordatorio de reserva - ${p.club}`,
    html: `<h3>Recordatorio</h3>
           <p>Pronto tenés reserva:</p>
           <ul><li>${p.fechaHumana}</li><li>${p.club}</li><li>Cancha ${p.cancha}</li></ul>`,
    text: `Recordatorio: ${p.fechaHumana} - ${p.club} - Cancha ${p.cancha}`,
  };
}

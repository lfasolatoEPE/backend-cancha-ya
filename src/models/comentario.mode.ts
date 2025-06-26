export class Comentario {
  constructor(
    public id: string,
    public usuarioId: string,
    public canchaId: string,
    public mensaje: string,
    public puntuacion: number, // de 1 a 5
    public fecha: string // YYYY-MM-DD
  ) {}
}

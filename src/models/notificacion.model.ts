export class Notificacion {
  constructor(
    public id: string,
    public usuarioId: string,
    public mensaje: string,
    public leida: boolean = false,
    public enviadaEl: Date = new Date()
  ) {}
}

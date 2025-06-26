export class Deuda {
  constructor(
    public id: string,
    public usuarioId: string,
    public monto: number,
    public descripcion: string,
    public pagada: boolean = false,
    public fecha: string // YYYY-MM-DD
  ) {}
}

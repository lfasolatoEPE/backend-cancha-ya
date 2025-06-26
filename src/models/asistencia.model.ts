export class Asistencia {
  constructor(
    public id: string,
    public reservaId: string,
    public confirmada: boolean,
    public fechaConfirmacion?: string
  ) {}
}

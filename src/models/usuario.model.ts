export class Usuario {
  constructor(
    public id: string,
    public nombre: string,
    public email: string,
    public passwordHash: string,
    public tieneDeuda: boolean = false
  ) {}
}

export class Turno {
  constructor(
    public id: string,
    public canchaId: string,
    public fecha: string, // YYYY-MM-DD
    public hora: string,  // HH:mm
    public disponible: boolean = true
  ) {}
}

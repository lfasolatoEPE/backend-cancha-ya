export class Cancha {
  constructor(
    public id: string,
    public nombre: string,
    public deporte: string,
    public disponible: boolean,
    public horarioDisponible: string[] // ej: ["18:00", "19:00"]
  ) {}
}

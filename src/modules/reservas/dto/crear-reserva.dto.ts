import { IsUUID, IsISO8601 } from 'class-validator';

export class CrearReservaDto {
  @IsUUID()
  personaId!: string;

  @IsUUID()
  disponibilidadId!: string;

  @IsISO8601({}, { message: 'fechaHora debe estar en formato ISO8601 (ej: 2025-07-20T18:00:00Z)' })
  fechaHora!: string;
}

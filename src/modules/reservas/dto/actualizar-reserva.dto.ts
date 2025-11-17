import { IsISO8601, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class ActualizarReservaDto {
  @IsOptional()
  @IsUUID()
  disponibilidadId?: string;

  @IsOptional()
  @IsISO8601()
  fechaHora?: string;

  @ValidateIf(o => !o.disponibilidadId && !o.fechaHora)
  dummy?: any; // solo para disparar validación si ambos faltan
}

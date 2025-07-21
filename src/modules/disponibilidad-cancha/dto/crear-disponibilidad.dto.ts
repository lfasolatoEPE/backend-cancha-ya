import { IsUUID, IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class CrearDisponibilidadDto {
  @IsUUID()
  canchaId!: string;

  @IsUUID()
  horarioId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana!: number;

  @IsOptional()
  @IsBoolean()
  disponible?: boolean;
}

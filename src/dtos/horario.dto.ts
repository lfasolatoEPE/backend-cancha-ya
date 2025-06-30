import { IsNotEmpty, IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CrearHorarioDto {
  @IsUUID()
  canchaId!: string;

  @IsNotEmpty()
  @IsString()
  dia!: string;

  @IsNotEmpty()
  @IsString()
  horaInicio!: string;

  @IsNotEmpty()
  @IsString()
  horaFin!: string;
}

export class ActualizarHorarioDto {
  @IsOptional()
  @IsString()
  dia?: string;

  @IsOptional()
  @IsString()
  horaInicio?: string;

  @IsOptional()
  @IsString()
  horaFin?: string;

  @IsOptional()
  @IsBoolean()
  disponible?: boolean;
}

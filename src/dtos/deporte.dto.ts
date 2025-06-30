import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearDeporteDto {
  @IsNotEmpty()
  @IsString()
  nombre!: string;
}

export class ActualizarDeporteDto {
  @IsOptional()
  @IsString()
  nombre?: string;
}

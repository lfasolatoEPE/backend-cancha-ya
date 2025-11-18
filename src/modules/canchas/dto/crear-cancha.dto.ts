import { IsString, IsUUID, IsNumber, Min, IsOptional, Max } from 'class-validator';

export class CrearCanchaDto {
  @IsString()
  nombre!: string;

  // Dirección descriptiva (Av. Siempre Viva 123...)
  @IsString()
  ubicacion!: string;

  // Coordenadas geográficas
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud?: number;

  @IsNumber()
  @Min(0)
  precioPorHora!: number;

  @IsString()
  tipoSuperficie!: string;

  @IsUUID()
  clubId!: string;

  @IsUUID()
  deporteId!: string;
}

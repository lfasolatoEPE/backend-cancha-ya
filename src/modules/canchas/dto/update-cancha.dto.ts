import { IsOptional, IsString, IsNumber, Min, Max, IsUUID } from 'class-validator';

export class UpdateCanchaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  // Coordenadas opcionales
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioPorHora?: number;

  @IsOptional()
  @IsString()
  tipoSuperficie?: string;

  @IsOptional()
  @IsUUID()
  clubId?: string;

  @IsOptional()
  @IsUUID()
  deporteId?: string;
}

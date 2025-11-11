import { IsOptional, IsString, IsNumber, Min, IsUUID } from 'class-validator';

export class UpdateCanchaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

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

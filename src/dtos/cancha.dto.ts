import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID } from 'class-validator';

export class CrearCanchaDto {
  @IsNotEmpty()
  nombre!: string;

  @IsNotEmpty()
  ubicacion!: string;

  @IsNotEmpty()
  tipoSuperficie!: string;

  @IsNumber()
  precioPorHora!: number;

  @IsOptional()
  @IsUUID()
  deporteId?: string;
}

export class ActualizarCanchaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  tipoSuperficie?: string;

  @IsOptional()
  @IsNumber()
  precioPorHora?: number;

  @IsOptional()
  activa?: boolean;

  @IsOptional()
  @IsUUID()
  deporteId?: string;
}

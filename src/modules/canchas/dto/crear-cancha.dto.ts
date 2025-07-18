import { IsString, IsUUID, IsNumber, Min } from 'class-validator';

export class CrearCanchaDto {
  @IsString()
  nombre!: string;

  @IsString()
  ubicacion!: string;

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

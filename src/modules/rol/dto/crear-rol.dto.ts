import { IsString, MinLength } from 'class-validator';

export class CrearRolDto {
  @IsString()
  @MinLength(3)
  nombre!: string; // ej: 'recepcionista'
}
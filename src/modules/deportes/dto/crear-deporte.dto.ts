import { IsString, MinLength } from 'class-validator';

export class CrearDeporteDto {
  @IsString()
  @MinLength(3, { message: 'El nombre del deporte debe tener al menos 3 caracteres' })
  nombre!: string;
}

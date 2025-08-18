import { IsArray, ArrayMinSize, IsOptional, IsString } from 'class-validator';

export class AceptarDesafioDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe haber al menos un jugador rival' })
  jugadoresRival!: string[]; // array de IDs de Persona

  @IsOptional()
  @IsString()
  nombreRival?: string;
}

import { IsUUID, IsArray, ArrayMinSize, IsOptional, IsString } from 'class-validator';

export class CrearDesafioDto {
  @IsUUID()
  reservaId!: string;

  @IsUUID()
  deporteId!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe haber al menos un jugador retador' })
  jugadoresRetador!: string[]; // array de IDs de Persona

  @IsOptional()
  @IsString()
  nombreRetador?: string;
}

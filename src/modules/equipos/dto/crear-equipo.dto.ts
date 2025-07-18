import { IsString, IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class CrearEquipoDto {
  @IsString()
  nombre!: string;

  @IsUUID()
  deporteId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  jugadoresIds!: string[];
}

import { IsArray, ArrayNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CrearDesafioDto {
  @IsUUID()
  reservaId!: string;

  @IsUUID()
  deporteId!: string;

  // Invitados que recibirán mail para aceptar
  @IsArray()
  @ArrayNotEmpty()
  invitadosDesafiadosIds!: string[];

  // Opcional: además del creador, puede sumar compañeros de su lado
  @IsArray()
  @IsOptional()
  jugadoresCreadorIds?: string[];
}
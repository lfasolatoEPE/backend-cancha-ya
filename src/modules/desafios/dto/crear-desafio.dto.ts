import { IsUUID } from 'class-validator';

export class CrearDesafioDto {
  @IsUUID()
  reservaId!: string;

  @IsUUID()
  equipoRetadorId!: string;

  @IsUUID()
  deporteId!: string;
}

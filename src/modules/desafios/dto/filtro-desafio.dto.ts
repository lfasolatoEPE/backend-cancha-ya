import { IsOptional, IsIn, IsUUID } from 'class-validator';

export class FiltroDesafioDto {
  @IsOptional()
  @IsIn(['pendiente', 'aceptado', 'finalizado'])
  estado?: string;

  @IsOptional()
  @IsUUID()
  deporteId?: string;

  @IsOptional()
  @IsUUID()
  equipoId?: string;

  @IsOptional()
  @IsUUID()
  jugadorId?: string;
}

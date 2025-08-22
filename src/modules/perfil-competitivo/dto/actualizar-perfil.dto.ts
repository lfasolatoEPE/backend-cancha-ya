import { IsBoolean, IsOptional } from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
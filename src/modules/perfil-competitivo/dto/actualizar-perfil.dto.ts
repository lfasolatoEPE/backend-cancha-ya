import { IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ranking?: number;
}

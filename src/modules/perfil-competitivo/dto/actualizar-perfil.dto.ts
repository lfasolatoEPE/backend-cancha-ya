import { IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsBoolean()
  modoCompetitivo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ranking?: number;
}

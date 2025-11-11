import { IsOptional, IsString } from 'class-validator';

export class UpdateDeporteDto {
  @IsOptional()
  @IsString()
  nombre?: string;
}

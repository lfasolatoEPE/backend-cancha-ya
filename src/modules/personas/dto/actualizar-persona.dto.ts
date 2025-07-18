import { IsOptional, IsEmail, IsString } from 'class-validator';

export class ActualizarPersonaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

import { IsOptional, IsEmail, IsString } from 'class-validator';

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  nombre?: string;
  
  @IsOptional()
  @IsString()
  apellido?: string;
}

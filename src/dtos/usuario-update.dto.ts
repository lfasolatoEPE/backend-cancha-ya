import { IsEmail, IsOptional, MinLength } from 'class-validator';

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  email?: string;

  @IsOptional()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre?: string;
}

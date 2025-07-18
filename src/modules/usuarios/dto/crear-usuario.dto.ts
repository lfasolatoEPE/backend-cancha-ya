import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsIn } from 'class-validator';

export class CrearUsuarioDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre!: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsOptional()
  @IsIn(['usuario', 'admin'])
  rol?: string;
}

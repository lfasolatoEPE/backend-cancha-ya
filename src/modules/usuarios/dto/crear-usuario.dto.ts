import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsIn, Matches } from 'class-validator';

export class CrearUsuarioDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre!: string;

  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido!: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe tener al menos una mayúscula' })
  @Matches(/[a-z]/, { message: 'La contraseña debe tener al menos una minúscula' })
  @Matches(/[0-9]/, { message: 'La contraseña debe tener al menos un número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'La contraseña debe tener al menos un símbolo' })
  password!: string;

  @IsOptional()
  @IsIn(['usuario', 'admin'])
  rol?: string;
}

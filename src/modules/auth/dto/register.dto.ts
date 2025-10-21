import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty() nombre!: string;
  @IsNotEmpty() apellido!: string;
  @IsEmail() email!: string;

  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Debe incluir mayúscula' })
  @Matches(/[a-z]/, { message: 'Debe incluir minúscula' })
  @Matches(/[0-9]/, { message: 'Debe incluir número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Debe incluir símbolo' })
  password!: string;
}
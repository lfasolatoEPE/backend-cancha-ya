import { IsString, IsEmail, MinLength } from 'class-validator';

export class CrearClubDto {
  @IsString()
  @MinLength(3)
  nombre!: string;

  @IsString()
  direccion!: string;

  @IsString()
  telefono!: string;

  @IsEmail()
  email!: string;
}

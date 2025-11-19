import { IsEmail, IsOptional, IsString, IsNumber } from 'class-validator';

export class CrearClubDto {
  @IsString()
  nombre!: string;

  @IsString()
  direccion!: string;

  @IsString()
  telefono!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsNumber()
  latitud?: number | null;

  @IsOptional()
  @IsNumber()
  longitud?: number | null;
}

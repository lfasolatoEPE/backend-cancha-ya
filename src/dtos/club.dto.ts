import { IsNotEmpty, IsString } from 'class-validator';

export class CrearClubDto {
  @IsNotEmpty()
  nombre!: string;

  @IsNotEmpty()
  direccion!: string;

  @IsNotEmpty()
  telefono!: string;

  @IsNotEmpty()
  email!: string;
}

export class ActualizarClubDto {
  @IsString()
  nombre?: string;

  @IsString()
  direccion?: string;

  @IsString()
  telefono?: string;

  @IsString()
  email?: string;
}

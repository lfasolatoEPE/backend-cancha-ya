import { IsString, Matches } from 'class-validator';

export class CrearHorarioDto {
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato inválido (HH:mm)' })
  horaInicio!: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato inválido (HH:mm)' })
  horaFin!: string;
}

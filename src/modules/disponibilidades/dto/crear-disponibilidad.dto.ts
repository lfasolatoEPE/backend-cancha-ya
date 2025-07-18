import {
  IsDateString,
  IsString,
  Matches,
  IsUUID,
  IsArray,
  ArrayMinSize
} from 'class-validator';

export class CrearDisponibilidadDto {
  @IsDateString()
  fechaDesde!: string;

  @IsDateString()
  fechaHasta!: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm)' })
  horaDesde!: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm)' })
  horaHasta!: string;

  @IsUUID()
  deporteId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  clubesIds!: string[];
}

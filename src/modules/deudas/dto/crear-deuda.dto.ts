import { IsUUID, IsDecimal, IsDateString } from 'class-validator';

export class CrearDeudaDto {
  @IsUUID()
  personaId!: string;

  @IsDecimal()
  monto!: number;

  @IsDateString()
  fechaVencimiento!: string;
}
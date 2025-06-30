import { IsUUID, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CrearDeudaDto {
  @IsUUID('4', { message: 'ID de usuario inválido' })
  usuarioId!: string;

  @IsNumber()
  monto!: number;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}

export class ActualizarDeudaDto {
  @IsOptional()
  @IsNumber()
  monto?: number;

  @IsOptional()
  @IsBoolean()
  pagada?: boolean;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}

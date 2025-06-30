import { IsUUID, IsNotEmpty, IsDateString } from 'class-validator';

export class CrearReservaDto {
  @IsUUID('4', { message: 'El ID de usuario debe ser un UUID válido' })
  usuarioId!: string;

  @IsUUID('4', { message: 'El ID de cancha debe ser un UUID válido' })
  canchaId!: string;

  @IsDateString({}, { message: 'La fecha debe tener formato ISO (YYYY-MM-DD)' })
  fecha!: string;

  @IsNotEmpty({ message: 'La hora es obligatoria' })
  hora!: string;
}

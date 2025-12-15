import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class CrearReservaDto {
  @IsUUID('4')
  disponibilidadId!: string;

  @IsISO8601()
  fechaHora!: string;

  // 👇 solo admin/admin-club pueden mandarlo para asignar reserva
  @IsOptional()
  @IsUUID('4')
  personaId?: string;
}

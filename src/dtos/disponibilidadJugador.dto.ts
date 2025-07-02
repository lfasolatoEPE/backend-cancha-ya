import { IsArray, IsDateString, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateDisponibilidadJugadorDto {
  @IsDateString()
  fechaDesde!: string;

  @IsDateString()
  fechaHasta!: string;

  @IsString()
  horaDesde!: string;

  @IsString()
  horaHasta!: string;

  @IsUUID()
  deporteId!: string;

  @IsArray()
  @IsUUID("all", { each: true })
  clubes!: string[];
}

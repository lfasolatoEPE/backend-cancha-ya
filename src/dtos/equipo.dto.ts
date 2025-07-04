import { IsString, IsUUID, IsArray } from "class-validator";

export class CrearEquipoDto {
  @IsString()
  nombre!: string;

  @IsUUID()
  deporteId!: string;

  @IsArray()
  @IsUUID("all", { each: true })
  jugadoresIds!: string[];
}

export class ActualizarEquipoDto {
  @IsString()
  nombre!: string;

  @IsArray()
  @IsUUID("all", { each: true })
  jugadoresIds!: string[];
}

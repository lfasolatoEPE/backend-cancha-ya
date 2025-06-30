import { IsUUID, IsInt, Min, Max, IsString, IsNotEmpty } from 'class-validator';

export class CrearValoracionDto {
  @IsUUID()
  usuarioId!: string;

  @IsUUID()
  canchaId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  puntaje!: number;

  @IsString()
  @IsNotEmpty()
  comentario!: string;
}

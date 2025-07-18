import { IsIn, IsNotEmpty, IsUUID, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class CrearValoracionDto {
  @IsIn(['club', 'cancha', 'usuario', 'equipo'])
  tipo_objetivo!: 'club' | 'cancha' | 'usuario' | 'equipo';

  @IsUUID()
  id_objetivo!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  puntaje!: number;

  @IsOptional()
  @IsString()
  comentario?: string;
}

import { IsArray, ArrayNotEmpty, IsIn } from 'class-validator';

export class AgregarJugadoresDto {
  @IsIn(['creador', 'desafiado'])
  lado!: 'creador' | 'desafiado';

  @IsIn(['invitar', 'remover'])
  accion!: 'invitar' | 'remover';

  @IsArray()
  @ArrayNotEmpty()
  jugadoresIds!: string[];
}

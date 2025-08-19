import { IsArray, ArrayNotEmpty, IsIn } from 'class-validator';

export class AgregarJugadoresDto {
    @IsIn(['creador', 'desafiado'])
    lado!: 'creador' | 'desafiado';

    @IsArray()
    @ArrayNotEmpty()
    jugadoresIds!: string[];
}
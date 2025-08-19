import { IsIn, IsOptional, Matches, IsInt, Min, Max } from 'class-validator';

export class FinalizarDesafioDto {
  @IsIn(['creador', 'desafiado'])
  ganadorLado!: 'creador' | 'desafiado';

  // formato opcional "x-y"
  @IsOptional()
  @Matches(/^\s*\d+\s*-\s*\d+\s*$/)
  resultado?: string;

  // valoración opcional 1..5
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  valoracion?: number;
}
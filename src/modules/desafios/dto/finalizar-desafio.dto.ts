import { IsString, Matches } from 'class-validator';

export class FinalizarDesafioDto {
  @IsString()
  @Matches(/^\\d+\\s*\\-\\s*\\d+$/, {
    message: 'El resultado debe tener el formato "3-2"',
  })
  resultado!: string;
}

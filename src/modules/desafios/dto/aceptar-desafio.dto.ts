import { IsUUID } from 'class-validator';

export class AceptarDesafioDto {
  @IsUUID()
  equipoRivalId!: string;
}

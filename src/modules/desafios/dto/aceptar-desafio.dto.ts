import { IsUUID } from 'class-validator';

export class AceptarDesafioDto {
  @IsUUID()
  personaId!: string; // el invitado que acepta
}
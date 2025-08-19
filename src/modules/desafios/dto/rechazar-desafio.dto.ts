import { IsUUID } from 'class-validator';

export class RechazarDesafioDto {
@IsUUID()
personaId!: string; // el invitado que rechaza
}
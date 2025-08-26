import { IsIn } from 'class-validator';

export class CambiarRolDto {
  @IsIn(['usuario', 'admin'])
  rol!: 'usuario' | 'admin';
}

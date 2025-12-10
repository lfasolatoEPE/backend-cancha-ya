import { IsIn, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CambiarRolDto {
  @IsIn(['usuario', 'admin', 'admin-club'])
  rol!: 'usuario' | 'admin' | 'admin-club';

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  clubIds?: string[];
}

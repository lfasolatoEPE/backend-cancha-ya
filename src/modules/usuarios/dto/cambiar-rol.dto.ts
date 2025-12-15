import { IsArray, IsOptional, IsString, IsUUID, ArrayNotEmpty } from 'class-validator';

export class CambiarRolDto {
  @IsString()
  rol!: string; // nombre del rol en BD (admin, usuario, recepcionista, admin-club, etc.)

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  clubIds?: string[];
}

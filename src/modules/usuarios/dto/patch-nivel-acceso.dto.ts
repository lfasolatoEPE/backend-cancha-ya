import { IsArray, IsEnum, IsOptional, IsUUID, ValidateIf, ArrayNotEmpty } from 'class-validator';
import { NivelAcceso } from '../../../entities/Rol.entity';

export class PatchNivelAccesoDto {
  @IsEnum(NivelAcceso)
  nivelAcceso!: NivelAcceso; // 'usuario' | 'admin-club' | 'admin'

  @ValidateIf(o => o.nivelAcceso === NivelAcceso.AdminClub)
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  clubIds?: string[];
}

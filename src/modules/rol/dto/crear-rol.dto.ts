import { IsEnum, IsString, MinLength } from 'class-validator';
import { NivelAcceso } from '../../../entities/Rol.entity';

export class CrearRolDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  // ✅ qué permisos hereda el rol de negocio
  @IsEnum(NivelAcceso)
  nivelAcceso!: NivelAcceso; // 'usuario' | 'admin-club' | 'admin'
}

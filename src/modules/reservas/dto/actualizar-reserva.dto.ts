import { IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { AtLeastOne } from '../../../utils/validators/at-least-one';

@AtLeastOne(['disponibilidadId', 'fechaHora'])
export class ActualizarReservaDto {
  @IsOptional()
  @IsUUID('4')
  disponibilidadId?: string;

  @IsOptional()
  @IsISO8601()
  fechaHora?: string;
}

// src/modules/admin/dto/range.dto.ts
import { IsIn, IsOptional, IsUUID, IsISO8601 } from 'class-validator';

export class RangeDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
  @IsOptional() tz?: string;

  @IsOptional() @IsIn(['day','week','month']) granularity?: 'day'|'week'|'month';

  @IsOptional() @IsUUID() clubId?: string;
  @IsOptional() @IsUUID() canchaId?: string;

  @IsOptional() @IsIn(['pendiente','confirmada','cancelada']) estado?: 'pendiente'|'confirmada'|'cancelada';

  @IsOptional() @IsIn(['club','cancha']) by?: 'club'|'cancha';

  @IsOptional() @IsIn(['club','cancha','detalle']) level?: 'club'|'cancha'|'detalle';
}

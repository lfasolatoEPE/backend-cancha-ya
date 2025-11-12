import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AvailabilityQueryDto {
  @IsDateString()
  from!: string; // 'YYYY-MM-DD'

  @IsDateString()
  to!: string;   // 'YYYY-MM-DD'

  @IsOptional()
  @IsUUID('4')
  clubId?: string;

  @IsOptional()
  @IsUUID('4')
  canchaId?: string;
}

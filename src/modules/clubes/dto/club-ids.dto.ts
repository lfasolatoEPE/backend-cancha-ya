import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

const toArray = <T>(v: T | T[]) => (Array.isArray(v) ? v : v !== undefined && v !== null ? [v] : []);

export class ClubIdsDto {
  @Transform(({ value }) => toArray<string>(value))
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  clubIds!: string[];
}

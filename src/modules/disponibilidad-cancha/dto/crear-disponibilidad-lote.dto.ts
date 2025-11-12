import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

function toArray<T>(v: T | T[]): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

export class CrearDisponibilidadLoteDto {
  @Transform(({ value }) => toArray<string>(value))
  @IsArray()
  @IsUUID('4', { each: true })
  canchaIds!: string[];

  @Transform(({ value }) => toArray<string>(value))
  @IsArray()
  @IsUUID('4', { each: true })
  horarioIds!: string[];

  // Acepta 1..7, normaliza 7→0 (domingo), 1..6 quedan igual
  @Transform(({ value }) => {
    const arr = toArray<number | string>(value).map((n) => Number(n));
    return arr.map((d) => (d === 7 ? 0 : d)); // 0..6 (0=dom)
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  diasSemana!: number[];

  @IsOptional()
  @IsBoolean()
  disponible?: boolean; // default true
}

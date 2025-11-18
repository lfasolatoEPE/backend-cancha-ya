import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Deporte } from './Deporte.entity';
import { DisponibilidadHorario } from './DisponibilidadHorario.entity';
import { Club } from './Club.entity';

@Entity()
export class Cancha {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  // Dirección escrita (ej: "Av. Siempre Viva 123, Santa Fe")
  @Column()
  ubicacion!: string;

  // Coordenadas para mapa (WGS84: lat/lon)
  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitud!: number | null;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitud!: number | null;

  @Column('decimal', { precision: 10, scale: 2 })
  precioPorHora!: number;

  @Column()
  tipoSuperficie!: string;

  @Column({ default: true })
  activa!: boolean;

  @ManyToOne(() => Deporte, { nullable: true })
  deporte!: Deporte;

  @ManyToOne(() => Club, club => club.canchas)
  club!: Club;

  @OneToMany(() => DisponibilidadHorario, disponibilidad => disponibilidad.cancha)
  disponibilidades!: DisponibilidadHorario[];
}

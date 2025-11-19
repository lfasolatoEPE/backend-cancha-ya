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

  /**
   * Referencia interna dentro del club.
   * Ej: "Cancha 1 techada", "Atrás, a la derecha", "Pasto sintético al fondo".
   */
  @Column()
  ubicacion!: string;

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

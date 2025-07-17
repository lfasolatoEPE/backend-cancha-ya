import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Reserva } from './Reserva.entity';
import { Deporte } from './Deporte.entity';
import { DisponibilidadHorario } from './DisponibilidadHorario.entity';
import { Club } from './Club.entity';

@Entity()
export class Cancha {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column()
  ubicacion!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precioPorHora!: number;

  @Column()
  tipoSuperficie!: string;

  @Column({ default: true })
  activa!: boolean;

  @OneToMany(() => Reserva, reserva => reserva.cancha)
  reservas!: Reserva[];

  @ManyToOne(() => Deporte, { nullable: true })
  deporte!: Deporte;

  @OneToMany(() => DisponibilidadHorario, disponibilidad => disponibilidad.cancha)
  disponibilidades!: DisponibilidadHorario[];

  @ManyToOne(() => Club, club => club.canchas)
  club!: Club;

}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Club } from './Club.entity';
import { Reserva } from './Reserva.entity';
import { Comentario } from './Comentario.entity';

@Entity()
export class Cancha {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column()
  deporte!: string;

  @Column()
  precioPorHora!: number;

  @Column({ default: true })
  habilitada!: boolean;

  @ManyToOne(() => Club, club => club.canchas)
  club!: Club;

  @OneToMany(() => Reserva, reserva => reserva.cancha)
  reservas!: Reserva[];

  @OneToMany(() => Comentario, comentario => comentario.cancha)
  comentarios!: Comentario[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne
} from 'typeorm';
import { Persona } from './Persona.entity';
import { Deporte } from './Deporte.entity';

@Entity()
export class Equipo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @ManyToOne(() => Deporte, { eager: true })
  deporte!: Deporte;

  @ManyToMany(() => Persona, { eager: true })
  @JoinTable()
  jugadores!: Persona[];

  @Column({ default: 1000 })
  ranking!: number;

  @Column()
  partidosJugados!: number;

  @Column()
  partidosGanados!: number;
}

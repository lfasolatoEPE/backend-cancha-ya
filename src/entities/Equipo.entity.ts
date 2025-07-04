import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne
} from 'typeorm';
import { Usuario } from './Usuario.entity';
import { Deporte } from './Deporte.entity';

@Entity()
export class Equipo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @ManyToOne(() => Deporte, { eager: true })
  deporte!: Deporte;

  @ManyToMany(() => Usuario, { eager: true })
  @JoinTable()
  jugadores!: Usuario[];

  @Column({ default: 1000 })
  ranking!: number;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn
} from 'typeorm';
import { Equipo } from './Equipo.entity';
import { Deporte } from './Deporte.entity';

export type EstadoDesafio = 'pendiente' | 'aceptado' | 'finalizado';

@Entity()
export class Desafio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Equipo, { eager: true })
  equipoRetador!: Equipo;

  @ManyToOne(() => Equipo, { eager: true, nullable: true })
  equipoRival!: Equipo | null;

  @ManyToOne(() => Deporte, { eager: true })
  deporte!: Deporte;

  @Column()
  fecha!: string; // yyyy-mm-dd

  @Column()
  hora!: string; // hh:mm

  @Column({ default: 'pendiente' })
  estado!: EstadoDesafio;

  @Column({ type: 'varchar', nullable: true })
  resultado!: string | null;

  @CreateDateColumn()
  creadoEl!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
  OneToOne,
  CreateDateColumn
} from 'typeorm';
import { Equipo } from './Equipo.entity';
import { Deporte } from './Deporte.entity';
import { Reserva } from './Reserva.entity';

export enum EstadoDesafio {
  Pendiente = 'pendiente',
  Aceptado = 'aceptado',
  Finalizado = 'finalizado'
}

@Entity()
export class Desafio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  
  @OneToOne(() => Reserva, { eager: true })
  @JoinColumn()
  reserva!: Reserva;
  
  @ManyToOne(() => Equipo)
  equipoRetador!: Equipo;

  @ManyToOne(() => Equipo, { nullable: true })
  equipoRival!: Equipo | null;

  @ManyToOne(() => Deporte)
  deporte!: Deporte;
  
  @Column({
    type: 'enum',
    enum: EstadoDesafio,
    default: EstadoDesafio.Pendiente
  })
  estado!: EstadoDesafio;

  @Column({ type: 'varchar', nullable: true })
  resultado!: string | null;

  @CreateDateColumn()
  creadoEl!: Date;
}

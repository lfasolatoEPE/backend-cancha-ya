import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { Deporte } from './Deporte.entity';
import { Reserva } from './Reserva.entity';
import { Persona } from './Persona.entity';

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

  @ManyToOne(() => Deporte)
  deporte!: Deporte;

  @ManyToMany(() => Persona, { eager: true })
  @JoinTable()
  jugadoresRetador!: Persona[];

  @ManyToMany(() => Persona, { eager: true })
  @JoinTable()
  jugadoresRival!: Persona[];

  @Column({ nullable: true })
  nombreRetador?: string;

  @Column({ nullable: true })
  nombreRival?: string;

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

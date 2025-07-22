import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Persona } from './Persona.entity';
import { DisponibilidadHorario } from './DisponibilidadHorario.entity';

export enum EstadoReserva {
  Pendiente = 'pendiente',
  Confirmada = 'confirmada',
  Cancelada = 'cancelada'
}

@Entity()
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamp' })
  fechaHora!: Date;

  @Column()
  creadaEl!: Date;

  @ManyToOne(() => Persona)
  persona!: Persona;

  @ManyToOne(() => DisponibilidadHorario, { eager: true })
  disponibilidad!: DisponibilidadHorario;

  @Column({ type: 'enum', enum: EstadoReserva, default: EstadoReserva.Pendiente })
  estado!: EstadoReserva;
}

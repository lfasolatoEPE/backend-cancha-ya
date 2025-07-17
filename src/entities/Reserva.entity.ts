import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cancha } from './Cancha.entity';
import { Horario } from './Horario.entity';
import { Persona } from './Persona.entity';

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

  @ManyToOne(() => Cancha, cancha => cancha.reservas, { eager: true })
  cancha!: Cancha;

  @ManyToOne(() => Horario, { eager: true })
  horario!: Horario;

  @Column({ type: 'enum', enum: EstadoReserva, default: EstadoReserva.Pendiente })
  estado!: EstadoReserva;
}

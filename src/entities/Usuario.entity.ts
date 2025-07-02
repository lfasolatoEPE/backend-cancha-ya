import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm';
import { Reserva } from './Reserva.entity';
import { Valoracion } from './Valoracion.entity';
import { Deuda } from './Deuda.entity';
import { DisponibilidadJugador } from './DisponibilidadJugador';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: 'usuario' })
  rol!: 'usuario' | 'admin';

  @Column({ default: true })
  activo!: boolean;

  @OneToMany(() => Reserva, reserva => reserva.usuario)
  reservas!: Reserva[];

  @OneToMany(() => Valoracion, valoracion => valoracion.usuario)
  valoraciones!: Valoracion[];

  @OneToMany(() => Deuda, deuda => deuda.usuario)
  deudas!: Deuda[];
  
  @OneToMany(() => DisponibilidadJugador, disponibilidad => disponibilidad.usuario)
  disponibilidades!: DisponibilidadJugador[];
}
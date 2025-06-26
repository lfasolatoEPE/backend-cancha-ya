import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm';
import { Reserva } from './Reserva.entity';
import { Comentario } from './Comentario.entity';
import { Deuda } from './Deuda.entity';

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

  @OneToMany(() => Comentario, comentario => comentario.usuario)
  comentarios!: Comentario[];

  @OneToMany(() => Deuda, deuda => deuda.usuario)
  deudas!: Deuda[];
}
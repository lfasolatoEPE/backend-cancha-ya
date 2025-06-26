import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from './Usuario.entity';
import { Cancha } from './Cancha.entity';

@Entity()
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fecha!: string;

  @Column()
  hora!: string;

  @Column({ default: false })
  confirmada!: boolean;

  @Column()
  creadaEl!: Date;

  @ManyToOne(() => Usuario, usuario => usuario.reservas)
  usuario!: Usuario;

  @ManyToOne(() => Cancha, cancha => cancha.reservas)
  cancha!: Cancha;
}
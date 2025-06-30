import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cancha } from './Cancha.entity';

@Entity()
export class Horario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  dia!: string; // ej: Lunes, Martes

  @Column()
  horaInicio!: string;

  @Column()
  horaFin!: string;

  @Column({ default: true })
  disponible!: boolean;

  @ManyToOne(() => Cancha, cancha => cancha.horarios)
  cancha!: Cancha;
}

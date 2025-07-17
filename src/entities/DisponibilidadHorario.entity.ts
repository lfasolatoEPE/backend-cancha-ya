import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cancha } from "./Cancha.entity";
import { Horario } from "./Horario.entity";

@Entity()
export class DisponibilidadHorario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('int') // 0 = domingo, 1 = lunes, etc.
  diaSemana!: number;

  @ManyToOne(() => Cancha, cancha => cancha.disponibilidades, { onDelete: 'CASCADE' })
  cancha!: Cancha;

  @ManyToOne(() => Horario, { eager: true })
  horario!: Horario;

  @Column({ default: true })
  disponible!: boolean;
}

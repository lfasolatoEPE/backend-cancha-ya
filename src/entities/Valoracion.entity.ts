import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from './Usuario.entity';
import { Cancha } from './Cancha.entity';

@Entity()
export class Valoracion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('int')
  puntaje!: number; // por ej: 1 a 5

  @Column()
  comentario!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;

  @ManyToOne(() => Usuario, usuario => usuario.valoraciones)
  usuario!: Usuario;

  @ManyToOne(() => Cancha, cancha => cancha.valoraciones)
  cancha!: Cancha;
}

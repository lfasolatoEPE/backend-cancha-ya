import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from './Usuario.entity';
import { Cancha } from './Cancha.entity';

@Entity()
export class Comentario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  mensaje!: string;

  @Column()
  puntuacion!: number;

  @Column()
  fecha!: string;

  @ManyToOne(() => Usuario, usuario => usuario.comentarios)
  usuario!: Usuario;

  @ManyToOne(() => Cancha, cancha => cancha.comentarios)
  cancha!: Cancha;
}
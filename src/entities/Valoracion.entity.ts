import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from './Usuario.entity';

@Entity()
export class Valoracion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tipo_objetivo!: 'club' | 'cancha' | 'usuario' | 'equipo';

  @Column()
  id_objetivo!: string;

  @Column()
  puntaje!: number; // 1-5

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;

  @Column({ nullable: true })
  comentario?: string;

  @ManyToOne(() => Usuario, usuario => usuario.valoraciones, { eager: true })
  usuario!: Usuario;
}

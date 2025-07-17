import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Usuario } from './Usuario.entity';

@Entity()
export class PerfilCompetitivo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: false })
  modoCompetitivo!: boolean;

  @Column({ default: 1000 })
  ranking!: number;

  @OneToOne(() => Usuario)
  @JoinColumn()
  usuario!: Usuario;
}

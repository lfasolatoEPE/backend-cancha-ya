import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm';
import { Usuario } from './Usuario.entity';

@Entity()
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  nombre!: string; // Ej: 'admin', 'usuario', 'moderador'

  @OneToMany(() => Usuario, usuario => usuario.rol)
  usuarios!: Usuario[];
}

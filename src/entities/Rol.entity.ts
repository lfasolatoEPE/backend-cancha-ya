import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from './Usuario.entity';

export type TipoRol = 'sistema' | 'negocio';

@Entity()
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  nombre!: string; // 'admin', 'usuario', 'admin-club', 'recepcionista', etc.

  @Column({ type: 'varchar', default: 'negocio' })
  tipo!: TipoRol; // 'sistema' o 'negocio'

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios!: Usuario[];
}
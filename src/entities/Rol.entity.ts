import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from './Usuario.entity';

export enum TipoRol {
  Sistema = 'sistema',
  Negocio = 'negocio',
}

@Entity()
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  nombre!: string; // 'admin' | 'admin-club' | 'usuario' | ...

  @Column({
    type: 'enum',
    enum: TipoRol,
    default: TipoRol.Negocio,
  })
  tipo!: TipoRol;
  
  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios!: Usuario[];
}
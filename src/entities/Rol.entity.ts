import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from './Usuario.entity';

export enum TipoRol {
  Sistema = 'sistema',
  Negocio = 'negocio',
}

export enum NivelAcceso {
  Usuario = 'usuario',
  AdminClub = 'admin-club',
  Admin = 'admin',
}

@Entity()
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  nombre!: string; // 'admin' | 'admin-club' | 'usuario' | 'recepcionista' | ...

  @Column({
    type: 'enum',
    enum: TipoRol,
    default: TipoRol.Negocio,
  })
  tipo!: TipoRol;

  // ✅ NUEVO: define qué permisos hereda este rol
  @Column({
    type: 'enum',
    enum: NivelAcceso,
    default: NivelAcceso.Usuario,
  })
  nivelAcceso!: NivelAcceso;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios!: Usuario[];
}

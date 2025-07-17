import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Persona } from './Persona.entity';
import { Rol } from './Rol.entity';
import { Valoracion } from './Valoracion.entity';
import { PerfilCompetitivo } from './PerfilCompetitivo.entity';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: true })
  activo!: boolean;

  @ManyToOne(() => Persona)
  @JoinColumn()
  persona!: Persona;

  @ManyToOne(() => Rol)
  @JoinColumn()
  rol!: Rol;

  @OneToMany(() => Valoracion, valoracion => valoracion.usuario)
  valoraciones!: Valoracion[];

  @OneToOne(() => PerfilCompetitivo, perfil => perfil.usuario)
  perfilCompetitivo!: PerfilCompetitivo;

}

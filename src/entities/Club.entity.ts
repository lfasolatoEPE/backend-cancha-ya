// src/entities/Club.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { Cancha } from './Cancha.entity';
import { Valoracion } from './Valoracion.entity';
import { Usuario } from './Usuario.entity';

@Entity()
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column()
  direccion!: string;

  @Column()
  telefono!: string;

  @Column()
  email!: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitud!: number | null;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitud!: number | null;

  @OneToMany(() => Cancha, (cancha) => cancha.club)
  canchas!: Cancha[];

  // ⬅️ NUEVO: usuarios que administran este club
  @ManyToMany(() => Usuario, (user) => user.adminClubs)
  adminUsers!: Usuario[];

  // (si ya tenías Valoracion, mantenelo)
  // @OneToMany(() => Valoracion, (v) => v.club)
  // valoraciones!: Valoracion[];
}

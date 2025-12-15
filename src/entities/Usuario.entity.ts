// src/entities/Usuario.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Persona } from './Persona.entity';
import { Rol } from './Rol.entity';
import { PerfilCompetitivo } from './PerfilCompetitivo.entity';
import { Exclude } from 'class-transformer';
import { Club } from './Club.entity'; // ⬅️ NUEVO
import { NivelAcceso } from './Rol.entity';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ select: false })
  @Exclude()
  passwordHash!: string;

  @Column({ default: true })
  activo!: boolean;

  @ManyToOne(() => Persona, { eager: true })
  @JoinColumn()
  persona!: Persona;

  @ManyToOne(() => Rol, { eager: true })
  @JoinColumn()
  rol!: Rol;

  @Column({ type: 'enum', enum: NivelAcceso, default: NivelAcceso.Usuario })
  nivelAcceso!: NivelAcceso;

  // ⬅️ NUEVO: clubes que administra (solo para rol 'admin-club')
  @ManyToMany(() => Club, (club) => club.adminUsers, { eager: true })
  @JoinTable({
    name: 'usuario_admin_club',
    joinColumn: { name: 'usuarioId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'clubId', referencedColumnName: 'id' },
  })
  adminClubs!: Club[];

  @OneToOne(() => PerfilCompetitivo, (perfil) => perfil.usuario)
  perfilCompetitivo!: PerfilCompetitivo;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

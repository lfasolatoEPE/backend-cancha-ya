import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Persona } from './Persona.entity';
import { Rol } from './Rol.entity';
import { PerfilCompetitivo } from './PerfilCompetitivo.entity';
import { Exclude } from 'class-transformer';

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

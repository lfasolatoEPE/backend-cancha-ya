// src/entities/EloHistory.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { PerfilCompetitivo } from './PerfilCompetitivo.entity';
import { Desafio } from './Desafio.entity';

@Entity()
export class EloHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PerfilCompetitivo, { eager: true })
  perfil!: PerfilCompetitivo;

  @ManyToOne(() => Desafio, { nullable: true })
  desafio?: Desafio;

  @Column({ type: 'int' })
  rankingAnterior!: number;

  @Column({ type: 'int' })
  rankingNuevo!: number;

  @Column({ type: 'int' })
  delta!: number;

  @CreateDateColumn()
  creadoEl!: Date;
}

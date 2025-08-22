// src/entities/PerfilCompetitivo.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Usuario } from './Usuario.entity';
import { EloHistory } from './EloHistory.entity';

@Entity()
export class PerfilCompetitivo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Usuario, { eager: true })
  usuario!: Usuario;

  @Column({ default: true })
  activo!: boolean;

  @Column({ type: 'int', default: 1200 })
  ranking!: number;

  // --- NUEVO: métricas de desempeño ---
  @Column({ type: 'int', default: 0 })
  partidosJugados!: number;

  @Column({ type: 'int', default: 0 })
  victorias!: number;

  @Column({ type: 'int', default: 0 })
  empates!: number;

  @Column({ type: 'int', default: 0 })
  derrotas!: number;

  @Column({ type: 'int', default: 0 })
  golesFavor!: number;

  @Column({ type: 'int', default: 0 })
  golesContra!: number;

  // racha: positivo = victorias consecutivas, negativo = derrotas consecutivas
  @Column({ type: 'int', default: 0 })
  racha!: number;

  @OneToMany(() => EloHistory, (h) => h.perfil)
  historialElo!: EloHistory[];
}

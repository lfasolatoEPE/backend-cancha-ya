// entities/PerfilCompetitivo.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from './Usuario.entity';
import { EloHistory } from './EloHistory.entity';

@Entity()
export class PerfilCompetitivo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn() // este lado posee la FK
  usuario!: Usuario;

  @Column({ default: true })
  activo!: boolean;

  @Column({ type: 'int', default: 1200 })
  ranking!: number;

  @Column({ type: 'int', default: 0 }) partidosJugados!: number;
  @Column({ type: 'int', default: 0 }) victorias!: number;
  @Column({ type: 'int', default: 0 }) empates!: number;
  @Column({ type: 'int', default: 0 }) derrotas!: number;
  @Column({ type: 'int', default: 0 }) golesFavor!: number;
  @Column({ type: 'int', default: 0 }) golesContra!: number;
  @Column({ type: 'int', default: 0 }) racha!: number;

  @OneToMany(() => EloHistory, (h) => h.perfil)
  historialElo!: EloHistory[];
}

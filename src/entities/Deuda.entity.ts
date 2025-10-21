// Deuda.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Persona } from './Persona.entity';

@Entity()
export class Deuda {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  monto!: number;

  @Column({ default: false })
  pagada!: boolean;

  @Column({ type: 'date', nullable: true })
  fechaVencimiento?: string | null;

  @ManyToOne(() => Persona, { eager: true })
  persona!: Persona;
}

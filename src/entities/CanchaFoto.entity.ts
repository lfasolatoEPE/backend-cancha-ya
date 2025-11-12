import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { Cancha } from './Cancha.entity';

@Index('idx_cancha_foto_cancha', ['cancha'])
@Entity({ name: 'cancha_foto' })
export class CanchaFoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Cancha, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'canchaId' })
  cancha!: Cancha;

  @Column({ type: 'text' })
  url!: string;

  @Column({ type: 'int', default: 0 })
  orden!: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  creadaEl!: Date;
}

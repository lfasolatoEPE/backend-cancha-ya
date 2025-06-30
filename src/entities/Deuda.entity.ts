import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from './Usuario.entity';

@Entity()
export class Deuda {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  monto!: number;

  @Column({ default: false })
  pagada!: boolean;

  @Column({ type: 'date', nullable: true })
  fechaVencimiento!: string;

  @ManyToOne(() => Usuario, usuario => usuario.deudas)
  usuario!: Usuario;
}

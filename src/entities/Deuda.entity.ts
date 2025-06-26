import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Usuario } from './Usuario.entity';

@Entity()
export class Deuda {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  monto!: number;

  @Column()
  descripcion!: string;

  @Column({ default: false })
  pagada!: boolean;

  @Column()
  fecha!: string;

  @ManyToOne(() => Usuario, usuario => usuario.deudas)
  usuario!: Usuario;
}
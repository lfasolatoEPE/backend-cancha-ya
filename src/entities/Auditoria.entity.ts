import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne
} from 'typeorm';
import { Usuario } from './Usuario.entity';

@Entity()
export class Auditoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Usuario, { eager: true })
  usuario!: Usuario;

  @Column()
  accion!: string; // ej: "crear_reserva", "cancelar_reserva", "login", etc.

  @Column()
  entidad!: string; // ej: "reserva", "desafio", "deuda", etc.

  @Column()
  entidadId!: string;

  @Column({ nullable: true })
  descripcion?: string;

  @CreateDateColumn()
  fecha!: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Usuario } from "./Usuario.entity";
import { Club } from "./Club.entity";
import { Deporte } from "./Deporte.entity";

@Entity()
export class DisponibilidadJugador {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  fechaDesde!: Date;

  @Column()
  fechaHasta!: Date;

  @Column()
  horaDesde!: string;

  @Column()
  horaHasta!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.disponibilidades, { eager: true })
  usuario!: Usuario;

  @ManyToMany(() => Club, { eager: true })
  @JoinTable()
  clubes!: Club[];

  @ManyToOne(() => Deporte, { eager: true })
  deporte!: Deporte;
}

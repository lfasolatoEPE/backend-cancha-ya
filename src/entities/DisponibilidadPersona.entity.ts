import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Club } from "./Club.entity";
import { Deporte } from "./Deporte.entity";
import { Persona } from "./Persona.entity";

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

  @ManyToOne(() => Persona)
  persona!: Persona;

  @ManyToMany(() => Club, { eager: true })
  @JoinTable()
  clubes!: Club[];

  @ManyToOne(() => Deporte, { eager: true })
  deporte!: Deporte;
}

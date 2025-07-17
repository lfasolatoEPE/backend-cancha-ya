import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Horario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  horaInicio!: string; // ej: "18:00"

  @Column()
  horaFin!: string;    // ej: "19:00"
}

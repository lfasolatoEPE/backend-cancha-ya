import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cancha } from './Cancha.entity';
import { Valoracion } from './Valoracion.entity';

@Entity()
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column()
  direccion!: string;

  @Column()
  telefono!: string;

  @Column()
  email!: string;

  @OneToMany(() => Cancha, cancha => cancha.club)
  canchas!: Cancha[];
}

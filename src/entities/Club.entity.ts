import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cancha } from './Cancha.entity';

@Entity()
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column()
  direccion!: string;

  @Column()
  emailContacto!: string;

  @OneToMany(() => Cancha, cancha => cancha.club)
  canchas!: Cancha[];
}
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cancha } from './Cancha.entity';

@Entity()
export class Deporte {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;
}

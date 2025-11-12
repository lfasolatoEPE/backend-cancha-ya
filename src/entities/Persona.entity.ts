import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Persona {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Column()
  apellido!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;
}

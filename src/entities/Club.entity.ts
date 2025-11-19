import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cancha } from './Cancha.entity';
import { Valoracion } from './Valoracion.entity';

@Entity()
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  // Dirección física del club (para mostrar y geocodificar)
  @Column()
  direccion!: string;

  @Column()
  telefono!: string;

  @Column()
  email!: string;

  // 🔹 Coordenadas del club (para mapa)
  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitud!: number | null;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitud!: number | null;

  @OneToMany(() => Cancha, cancha => cancha.club)
  canchas!: Cancha[];

  // (si usás Valoracion)
  // @OneToMany(() => Valoracion, v => v.club)
  // valoraciones!: Valoracion[];
}

import {
Entity,
PrimaryGeneratedColumn,
Column,
CreateDateColumn,
ManyToOne,
OneToOne,
ManyToMany,
JoinColumn,
JoinTable,
} from 'typeorm';
import { Deporte } from './Deporte.entity';
import { Reserva } from './Reserva.entity';
import { Persona } from './Persona.entity';


export enum EstadoDesafio {
Pendiente = 'pendiente',
Aceptado = 'aceptado',
Cancelado = 'cancelado',
Finalizado = 'finalizado',
}

export enum LadoDesafio {
Creador = 'creador',
Desafiado = 'desafiado',
}

@Entity()
export class Desafio {
@PrimaryGeneratedColumn('uuid')
id!: string;

// Reserva que origina el desafío (única)
@OneToOne(() => Reserva, { eager: true })
@JoinColumn()
reserva!: Reserva;

@ManyToOne(() => Deporte, { eager: true })
deporte!: Deporte;

// Persona que inicia el desafío
@ManyToOne(() => Persona, { eager: true })
creador!: Persona;

// Lado A (creador) – jugadores confirmados
@ManyToMany(() => Persona, { eager: true })
@JoinTable({ name: 'desafio_jugadores_creador' })
jugadoresCreador!: Persona[];

// Invitados del lado desafiado (pendientes de aceptar)
@ManyToMany(() => Persona, { eager: true })
@JoinTable({ name: 'desafio_invitados_desafiados' })
invitadosDesafiados!: Persona[];

// Lado B (desafiados) – jugadores que aceptaron
@ManyToMany(() => Persona, { eager: true })
@JoinTable({ name: 'desafio_jugadores_desafiados' })
jugadoresDesafiados!: Persona[];

@Column({
type: 'enum',
enum: EstadoDesafio,
default: EstadoDesafio.Pendiente,
})
estado!: EstadoDesafio;

// Resultado opcional
@Column({ type: 'enum', enum: LadoDesafio, nullable: true })
ganador?: LadoDesafio | null;

@Column({ type: 'int', nullable: true })
golesCreador?: number | null;

@Column({ type: 'int', nullable: true })
golesDesafiado?: number | null;

// Valoraciones opcionales
@Column({ type: 'int', nullable: true })
valoracionCreador?: number | null;

@Column({ type: 'int', nullable: true })
valoracionDesafiado?: number | null;

@CreateDateColumn()
creadoEl!: Date;
}
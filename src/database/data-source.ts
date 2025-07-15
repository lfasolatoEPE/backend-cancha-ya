// import 'reflect-metadata';
// import { DataSource } from 'typeorm';
// import { Usuario } from '../entities/Usuario.entity';
// import { Cancha } from '../entities/Cancha.entity';
// import { Reserva } from '../entities/Reserva.entity';
// import { Club } from '../entities/Club.entity';
// import { Deuda } from '../entities/Deuda.entity';
// import { Deporte } from '../entities/Deporte.entity';
// import { Horario } from '../entities/Horario.entity';
// import { Valoracion } from '../entities/Valoracion.entity';
// import { DisponibilidadJugador } from '../entities/DisponibilidadJugador';

// import dotenv from 'dotenv';
// dotenv.config();

// export const AppDataSource = new DataSource({
//   type: 'postgres',
//   host: process.env.DB_HOST,
//   port: Number(process.env.DB_PORT),
//   username: process.env.DB_USERNAME,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   synchronize: true,
//   logging: false,
//   entities: [
//     Usuario,
//     Cancha,
//     Reserva,
//     Club,
//     Deuda,
//     Deporte,
//     Horario,
//     Valoracion,
//     DisponibilidadJugador
//   ],
//   migrations: [],
//   subscribers: [],
// });

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario.entity';
import { Cancha } from '../entities/Cancha.entity';
import { Reserva } from '../entities/Reserva.entity';
import { Club } from '../entities/Club.entity';
import { Deuda } from '../entities/Deuda.entity';
import { Deporte } from '../entities/Deporte.entity';
import { Horario } from '../entities/Horario.entity';
import { Valoracion } from '../entities/Valoracion.entity';
import { DisponibilidadJugador } from '../entities/DisponibilidadJugador';

import dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: false,
  entities: [
    Usuario,
    Cancha,
    Reserva,
    Club,
    Deuda,
    Deporte,
    Horario,
    Valoracion,
    DisponibilidadJugador
  ],
  migrations: [],
  subscribers: [],
});

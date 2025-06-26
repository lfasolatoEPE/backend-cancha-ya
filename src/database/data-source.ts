import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario.entity';
import { Cancha } from '../entities/Cancha.entity';
import { Reserva } from '../entities/Reserva.entity';
import { Club } from '../entities/Club.entity';
import { Comentario } from '../entities/Comentario.entity';
import { Deuda } from '../entities/Deuda.entity';

import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [Usuario, Cancha, Reserva, Club, Comentario, Deuda],
  migrations: [],
  subscribers: [],
});

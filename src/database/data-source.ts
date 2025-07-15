import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
// @ts-ignore
import glob from 'glob';

dotenv.config();

// DEBUG: Mostramos qué ruta ve __dirname
console.log("🧭 __dirname =", __dirname);

// DEBUG: Mostramos qué archivos detecta este patrón
const entityPaths = glob.sync(__dirname + '/entities/*.entity.{js,ts}');
console.log("🔍 Entidades detectadas por el patrón:", entityPaths);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: true, // así ves los CREATE TABLE
  entities: [__dirname + '/entities/*.entity.{js,ts}'],
  migrations: [],
  subscribers: [],
});

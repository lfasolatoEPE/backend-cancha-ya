import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: true, // activá logging para ver los CREATE TABLE
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [],
  subscribers: [],
});

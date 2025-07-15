import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// DEBUG: Mostrar __dirname
console.log("🧭 __dirname =", __dirname);

// DEBUG: Listar archivos en /entities
const entitiesDir = path.join(__dirname, 'entities');
console.log("🗂️ Buscando archivos en:", entitiesDir);

try {
  const files = fs.readdirSync(entitiesDir);
  const entityFiles = files.filter(f => f.endsWith('.entity.js') || f.endsWith('.entity.ts'));
  console.log("🔍 Entidades encontradas:", entityFiles);
} catch (error) {
  console.error("❌ Error leyendo carpeta de entidades:", error);
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  logging: true, // así ves los CREATE TABLE
  entities: [__dirname + '/entities/*.entity.{js,ts}'],
  migrations: [],
  subscribers: [],
});

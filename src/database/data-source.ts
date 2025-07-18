import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log("🧭 __dirname =", __dirname);

const entitiesDir = path.join(__dirname, '../entities');
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
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [__dirname + '/../entities/*.entity.{js,ts}'],
  migrations: [],
  subscribers: [],
});

// export const AppDataSource = new DataSource({
//   type: 'postgres',
//   url: process.env.DATABASE_URL,
//   synchronize: true,
//   logging: true,
//   entities: [__dirname + '/../entities/*.entity.{js,ts}'],
//   migrations: [],
//   subscribers: [],
// });

import 'dotenv/config';
import { DataSource } from 'typeorm';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida. Configurala con la Public connection de Railway (?sslmode=require)');
  process.exit(1);
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,        
  ssl: { rejectUnauthorized: false },  
  synchronize: true,                    
  logging: false,
  entities: [__dirname + '/../entities/*.entity.{js,ts}'],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  subscribers: [],
});

export const AppDataSourceReset = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: true,
  dropSchema: true,
  logging: false,
  entities: [__dirname + '/../entities/*.entity.{js,ts}'],
});

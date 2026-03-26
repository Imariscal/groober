import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';
import { config } from 'dotenv';

config();

const entities = path.join(__dirname, '../database/entities/**/*{.ts,.js}');
const migrations = path.join(__dirname, '../database/migrations/**/*{.ts,.js}');

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'vibralive_dev',
  password: process.env.DATABASE_PASSWORD || 'vibralive_password',
  database: process.env.DATABASE_NAME || 'vibralive_db',
  entities: [entities],
  migrations: [migrations],
  synchronize: false, // Use migrations instead
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};

export const AppDataSource = new DataSource(dataSourceOptions);

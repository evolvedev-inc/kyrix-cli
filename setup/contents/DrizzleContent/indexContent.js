export const indexContent = (provider) => `
import { drizzle } from 'drizzle-orm/${provider}2';
import ${provider} from '${provider}2/promise';
import * as schema from '../db/schema';

const connection = await ${provider}.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

export const db = drizzle(connection, { schema, mode: 'default' });
`;

export const indexContentPostgreSQL = `
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

const connection = postgres({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

export const db = drizzle(connection, { schema });
`;

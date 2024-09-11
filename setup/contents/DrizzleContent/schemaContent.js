export const schemaContentPostgreSQL = `
import { pgTable, uuid, timestamp, varchar, text } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('product_id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),
  title: varchar('title', { length: 255 }),
  description: text('description'),
});
`;

export const schemaContentMySQL = `
import { timestamp, char, varchar, int, mysqlTable } from 'drizzle-orm/mysql-core';

export const products = mysqlTable('products', {
    id: int('product_id').autoincrement().primaryKey(),
    createdAt: timestamp('created_at').defaultNow(),
    title: varchar('title', { length: 255 }).notNull(),
    description: char('description', { length: 255 }).notNull(),
});
`;

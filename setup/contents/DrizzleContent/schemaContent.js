export const schemaContentPostgreSQL = `
import { pgTable, serial, varchar, text, timestamp } from 'drizzle-kit';

export const Product = pgTable('product', {
  id: serial().primaryKey(),
  createdAt: timestamp().defaultNow(),
  title: varchar(255),
  desc: text(),
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
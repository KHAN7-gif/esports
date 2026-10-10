import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const tournament = sqliteTable('tournament', { id: text('id').primaryKey(), data: text('data').notNull(), version: integer('version').notNull() });

import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const leagues=sqliteTable('lel_leagues',{category:text('category').primaryKey(),data:text('data').notNull(),version:integer('version').notNull().default(1)});

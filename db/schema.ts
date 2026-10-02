// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const products=sqliteTable('products',{id:text('id').primaryKey(),data:text('data').notNull()});
export const settings=sqliteTable('settings',{key:text('key').primaryKey(),value:text('value').notNull()});
export const users=sqliteTable('users',{
 id:text('id').primaryKey(),username:text('username').notNull().unique(),
 passwordHash:text('password_hash').notNull(),role:text('role',{enum:['admin','user']}).notNull().default('user'),
 active:integer('active',{mode:'boolean'}).notNull().default(true),createdAt:integer('created_at').notNull()
});
export const sessions=sqliteTable('sessions',{
 tokenHash:text('token_hash').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),expiresAt:integer('expires_at').notNull()
},t=>[index('idx_sessions_user_id').on(t.userId)]);
export const loginAttempts=sqliteTable('login_attempts',{key:text('key').primaryKey(),attempts:integer('attempts').notNull(),windowStart:integer('window_start').notNull()});

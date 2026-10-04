import {pgTable,text,integer,bigint,boolean,jsonb,index,primaryKey} from 'drizzle-orm/pg-core';
import type {Product} from '../app/products';
export const products=pgTable('products',{
 id:text('id').primaryKey(),data:jsonb('data').$type<Product>().notNull(),
 createdAt:bigint('created_at',{mode:'number'}).notNull(),
});
export const productImages=pgTable('product_images',{
 productId:text('product_id').notNull().references(()=>products.id,{onDelete:'cascade'}),
 position:integer('position').notNull(),objectKey:text('object_key').notNull(),
},t=>[primaryKey({columns:[t.productId,t.position]}),index('idx_product_images_object_key').on(t.objectKey)]);
export const settings=pgTable('settings',{key:text('key').primaryKey(),value:text('value').notNull()});
export const users=pgTable('users',{
 id:text('id').primaryKey(),username:text('username').notNull().unique(),
 passwordHash:text('password_hash').notNull(),role:text('role',{enum:['admin','user']}).notNull().default('user'),
 active:boolean('active').notNull().default(true),createdAt:bigint('created_at',{mode:'number'}).notNull()
});
export const sessions=pgTable('sessions',{
 tokenHash:text('token_hash').primaryKey(),userId:text('user_id').notNull().references(()=>users.id,{onDelete:'cascade'}),expiresAt:bigint('expires_at',{mode:'number'}).notNull()
},t=>[index('idx_sessions_user_id').on(t.userId),index('idx_sessions_expires_at').on(t.expiresAt)]);
export const loginAttempts=pgTable('login_attempts',{key:text('key').primaryKey(),attempts:integer('attempts').notNull(),windowStart:bigint('window_start',{mode:'number'}).notNull()});

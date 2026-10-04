import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {neonConfig} from '@neondatabase/serverless';
import {createDatabase} from '../db/connection.mjs';
import {saveProduct,deleteProduct} from '../db/products.mjs';
import {recordLoginAttempt} from '../db/login-attempts.mjs';

test('PostgreSQL migration, Neon HTTP driver, atomic inventory and authorization',async()=>{
 const pg=new PGlite();
 const original=neonConfig.fetchFunction;
 let requests=0;
 // Execute the real driver's HTTP payloads against PostgreSQL in this test only.
 neonConfig.fetchFunction=async (_url,options)=>{
  requests++;
  const input=JSON.parse(options.body);
  async function execute(client,{query,params}){
   const result=await client.query(query,params);
   return {fields:result.fields,rows:result.rows.map(row=>result.fields.map(field=>{
    const value=row[field.name];
    return value===null?null:typeof value==='boolean'?(value?'t':'f'):typeof value==='object'?JSON.stringify(value):String(value);
   })),rowCount:result.rowCount,command:result.command};
  }
  try{
   const body=input.queries?{results:await pg.transaction(async tx=>{const results=[];for(const query of input.queries)results.push(await execute(tx,query));return results;})}:await execute(pg,input);
   return Response.json(body);
  }catch(error){return Response.json({message:error.message,code:error.code},{status:400});}
 };
 try{
  const db=createDatabase({DATABASE_URL:'postgresql://test:fixture@ep-test.neon.tech/aflur'});
  const journal=JSON.parse(await readFile(new URL('../postgres/meta/_journal.json',import.meta.url),'utf8'));
  for(const entry of journal.entries){
   const sql=await readFile(new URL(`../postgres/${entry.tag}.sql`,import.meta.url),'utf8');
   await db.transaction(sql.split('--> statement-breakpoint').map(text=>text.trim()).filter(Boolean).map(text=>({text})));
  }
  const product={id:'AF-TEST',name:"Camiseta ' especial",category:'Camisetas',audience:'Unisex',price:1250,sizes:['S','M'],images:['/api/images/a.jpg','/api/images/b.webp'],description:'',status:'Disponible',featured:false};
  await saveProduct(db,product);
  assert.deepEqual((await db.query('SELECT data FROM products WHERE id=$1',[product.id]))[0].data,product);
  assert.deepEqual(await db.query('SELECT object_key FROM product_images ORDER BY position'),[{object_key:'a.jpg'},{object_key:'b.webp'}]);
  await saveProduct(db,{...product,images:product.images.toReversed(),status:'Oculto'});
  assert.equal((await db.query('SELECT object_key FROM product_images ORDER BY position'))[0].object_key,'b.webp');
  assert.equal((await db.query('SELECT data FROM products'))[0].data.status,'Oculto');
  await assert.rejects(db.transaction([{text:'UPDATE products SET data=$1 WHERE id=$2',values:[JSON.stringify({...product,name:'Must roll back'}),product.id]},{text:'INSERT INTO product_images (product_id,position,object_key) VALUES ($1,0,$2)',values:['missing-product','bad.jpg']}]));
  assert.equal((await db.query('SELECT data FROM products'))[0].data.name,product.name);
  await db.query('INSERT INTO users (id,username,password_hash,role,active,created_at) VALUES ($1,$2,$3,$4,$5,$6)',['test-user',"admin' OR 1=1 --",'hash','admin',true,Date.now()]);
  assert.equal((await db.query('SELECT id FROM users WHERE username=$1',["' OR 1=1 --"])).length,0);
  await db.query('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)',['token','test-user',Date.now()+60000]);
  assert.equal((await db.query('SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2 AND u.active=true',['token',Date.now()])).length,1);
  await db.query('UPDATE users SET active=false WHERE id=$1',['test-user']);
  assert.equal((await db.query('SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2 AND u.active=true',['token',Date.now()])).length,0);
  await db.query('DELETE FROM users WHERE id=$1',['test-user']);
  assert.equal((await db.query('SELECT * FROM sessions')).length,0);
  await deleteProduct(db,product.id);
  assert.equal((await db.query('SELECT * FROM product_images')).length,0);
  assert.equal((await db.query("SELECT value FROM settings WHERE key='initialized'"))[0].value,'1');
  const now=Date.now();
  const attempts=await Promise.all(Array.from({length:11},()=>recordLoginAttempt(db,'account-test',now)));
  assert.equal(Math.max(...attempts),11);
  assert.equal((await db.query('SELECT attempts FROM login_attempts WHERE key=$1',['account-test']))[0].attempts,11);
  assert.equal(await recordLoginAttempt(db,'account-test',now+15*60000+1),1);
  // A configured Neon failure must not read stale data from D1.
  let legacyRead=false;
  neonConfig.fetchFunction=async()=>{throw Error('Neon unavailable');};
  const fail=createDatabase({DATABASE_URL:'postgresql://test:fixture@ep-test.neon.tech/aflur',DB:{prepare(){legacyRead=true;}}});
  await assert.rejects(fail.query('SELECT 1'));
  assert.equal(legacyRead,false);
  assert.ok(requests>15);
 }finally{neonConfig.fetchFunction=original;await pg.close();}
});

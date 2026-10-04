import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {neonDatabase} from './neon-env.mjs';
export async function migrateNeon(){
 const db=neonDatabase();
 const journal=JSON.parse(await readFile('postgres/meta/_journal.json','utf8'));
 await db.query('CREATE TABLE IF NOT EXISTS aflur_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at bigint NOT NULL)');
 const applied=await db.query('SELECT name,checksum FROM aflur_migrations');
 for(const entry of journal.entries){
  const sql=await readFile(`postgres/${entry.tag}.sql`,'utf8');
  const checksum=createHash('sha256').update(sql).digest('hex');
  const existing=applied.find(row=>row.name===entry.tag);
  if(existing){if(existing.checksum!==checksum)throw Error('Una migración aplicada fue modificada. Restaura el archivo antes de continuar.');continue;}
  const statements=sql.split('--> statement-breakpoint').map(text=>text.trim()).filter(Boolean).map(text=>({text}));
  statements.push({text:'INSERT INTO aflur_migrations (name,checksum,applied_at) VALUES ($1,$2,$3)',values:[entry.tag,checksum,Date.now()]});
  await db.transaction(statements);
  console.log(`Migración aplicada: ${entry.tag}`);
 }
 await db.query('SELECT id FROM users LIMIT 1');
 console.log('Neon: esquema verificado.');
}
try{await migrateNeon();}catch{console.error('No se pudo migrar Neon. Comprueba DATABASE_URL, la conexión y los archivos de postgres/.');process.exitCode=1;}

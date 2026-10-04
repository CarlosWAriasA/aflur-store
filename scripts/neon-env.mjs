import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createDatabase} from '../db/connection.mjs';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
if(!process.env.DATABASE_URL&&existsSync('.dev.vars'))process.loadEnvFile('.dev.vars');
export function neonDatabase(){
 if(!process.env.DATABASE_URL)throw Error('Falta DATABASE_URL. Configúrala en .dev.vars o en el entorno.');
 const url=new URL(process.env.DATABASE_URL);
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname.endsWith('.neon.tech'))throw Error('DATABASE_URL debe ser una conexión PostgreSQL de Neon.');
 return createDatabase({DATABASE_URL:process.env.DATABASE_URL});
}

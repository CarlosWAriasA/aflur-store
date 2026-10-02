import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hashPassword} from '../lib/password.mjs';
// Creates a new authorized account; never overwrites an existing account.
const username=(process.argv[2]||'').trim().toLowerCase();
const role=process.argv[3]||'admin';
if(!/^[a-z0-9._-]{3,40}$/.test(username)||!['admin','user'].includes(role)||process.argv.length>4){console.error('Uso: node scripts/create-user.mjs <usuario> [admin|user]');process.exit(1);}
const generated=!process.env.AFLUR_USER_PASSWORD;
const password=process.env.AFLUR_USER_PASSWORD||randomBytes(24).toString('base64url');
const hash=hashPassword(password);
await mkdir('.sites-runtime',{recursive:true});
const sql=resolve('.sites-runtime',`create-${randomUUID()}.sql`);
await writeFile(sql,`INSERT INTO users (id,username,password_hash,role,active,created_at) VALUES ('${randomUUID()}','${username}','${hash}','${role}',1,${Date.now()});`,{mode:0o600});
try{
 const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file',sql],{stdio:'pipe',encoding:'utf8'});
 if(result.status!==0){console.error('No se creó la cuenta. Comprueba la migración y que el usuario no exista.');process.exitCode=1;}
 else{if(generated){const path=resolve('.sites-runtime',`initial-${username}.txt`);await writeFile(path,`Usuario: ${username}\nContraseña: ${password}\n\nCuenta local. Cambia esta contraseña desde Administración > Cambiar contraseña.\n`,{mode:0o600,flag:'wx'});console.log(`Cuenta local creada. Credenciales privadas: ${path}`);}else console.log(`Cuenta local creada: ${username} (${role}).`);}
}finally{await unlink(sql);}

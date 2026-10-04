import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {hashPassword} from '../lib/password.mjs';
import {neonDatabase} from './neon-env.mjs';
const username=(process.argv[2]||'').trim().toLowerCase();
const role=process.argv[3]||'admin';
if(!/^[a-z0-9._-]{3,40}$/.test(username)||!['admin','user'].includes(role)||process.argv.length>4){console.error('Uso: node scripts/create-neon-user.mjs <usuario> [admin|user]');process.exit(1);}
try{
 const db=neonDatabase();
 const [existing]=await db.query('SELECT id FROM users WHERE username=$1',[username]);
 if(existing)throw Error('La cuenta ya existe.');
 const generated=!process.env.AFLUR_USER_PASSWORD;
 const password=process.env.AFLUR_USER_PASSWORD||randomBytes(24).toString('base64url');
 const hash=hashPassword(password);
 const path=resolve('.sites-runtime',`neon-${username}.txt`);
 if(generated){try{await access(path);throw Error('Ya existe un archivo privado para esta cuenta.');}catch(error){if(error.code!=='ENOENT')throw error;}}
 await mkdir('.sites-runtime',{recursive:true});
 // Write before creating the account so a filesystem failure cannot lose a password.
 if(generated)await writeFile(path,`Usuario: ${username}\nContraseña: ${password}\n\nCuenta de Neon. Cambia la contraseña desde Administración.\n`,{mode:0o600,flag:'wx'});
 await db.query('INSERT INTO users (id,username,password_hash,role,active,created_at) VALUES ($1,$2,$3,$4,true,$5)',[randomUUID(),username,hash,role,Date.now()]);
 console.log(generated?`Cuenta de Neon creada. Credenciales privadas: ${path}`:`Cuenta de Neon creada: ${username}.`);
}catch{console.error('No se creó la cuenta de Neon. Comprueba la conexión, las migraciones y que el usuario/archivo no exista.');process.exitCode=1;}

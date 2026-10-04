import {spawnSync} from 'node:child_process';
import {neonDatabase} from './neon-env.mjs';
import {saveProduct} from '../db/products.mjs';
// Explicit one-time import. Preserve existing Neon rows and skip old sessions.
if(process.argv[2]!=='--local'||process.argv.length!==3){console.error('Uso: node scripts/import-local-to-neon.mjs --local');process.exit(1);}
function rows(table){
 const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',`SELECT * FROM ${table}`,'--json'],{encoding:'utf8',stdio:'pipe'});
 if(result.status!==0)throw Error('No se pudo leer la base local.');
 return JSON.parse(result.stdout)[0].results;
}
try{
 const db=neonDatabase();
 const users=rows('users'),products=rows('products'),settings=rows('settings');
 for(const user of users)await db.query('INSERT INTO users (id,username,password_hash,role,active,created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',[user.id,user.username,user.password_hash,user.role,!!user.active,user.created_at]);
 for(const item of products){const [existing]=await db.query('SELECT id FROM products WHERE id=$1',[item.id]);if(!existing)await saveProduct(db,JSON.parse(item.data));}
 for(const setting of settings)await db.query('INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT DO NOTHING',[setting.key,setting.value]);
 console.log(`Importación terminada: ${users.length} cuentas, ${products.length} productos y ${settings.length} ajustes revisados. Las filas existentes se conservaron; las sesiones deben iniciarse de nuevo.`);
 console.log('Las fotos R2 de la vista previa son locales. Para producción, vuelve a subir esas fotos desde la administración.');
}catch{console.error('No se pudo completar la importación. Comprueba Neon, las migraciones y la base D1 local. Puedes reintentar sin sobrescribir las filas existentes.');process.exitCode=1;}

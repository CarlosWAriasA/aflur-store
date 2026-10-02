import {env} from 'cloudflare:workers';
import {Product,samples} from './products';
export function database(){if(!env.DB)throw new Error('Base de datos no disponible');return env.DB;}
export {isAdmin} from './auth';
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export async function allProducts(includeHidden=false):Promise<Product[]>{const db=database();const data=await db.prepare('SELECT data FROM products ORDER BY rowid DESC').all<{data:string}>();const initialized=await db.prepare("SELECT value FROM settings WHERE key = 'initialized'").first<{value:string}>();const result=data.results.map(p=>JSON.parse(p.data));return (result.length||initialized?result:samples).filter((p:Product)=>includeHidden||p.status!=='Oculto');}
export async function whatsapp(){const row=await database().prepare("SELECT value FROM settings WHERE key = 'whatsapp'").first<{value:string}>();return row?.value||'18293041914';}

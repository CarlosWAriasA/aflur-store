import {Product,samples} from './products';
import {database} from '../db';
export {database};
export {isAdmin} from './auth';
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export async function allProducts(includeHidden=false):Promise<Product[]>{
 const db=database();
 const [data,initialized]=await Promise.all([
  db.query<{data:Product|string}>(`SELECT data FROM products ORDER BY ${db.provider==='neon'?'created_at DESC,id DESC':'rowid DESC'}`),
  db.query<{value:string}>("SELECT value FROM settings WHERE key = 'initialized'"),
 ]);
 const result=data.map(p=>typeof p.data==='string'?JSON.parse(p.data) as Product:p.data);
 return (result.length||initialized.length?result:samples).filter(p=>includeHidden||p.status!=='Oculto');
}
export async function whatsapp(){const [row]=await database().query<{value:string}>("SELECT value FROM settings WHERE key = 'whatsapp'");return row?.value||'18293041914';}

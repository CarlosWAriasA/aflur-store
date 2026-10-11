import {database,isAdmin,sameOrigin,whatsapp} from '../../server';
import {listOptions,productList} from '../../../lib/product-list.mjs';
import {productSchema as schema} from '../../../lib/product-schema.mjs';
import {z} from 'zod';
import {saveProduct,deleteProduct} from '../../../db/products.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!await isAdmin())return Response.json({error:'Acceso de administrador requerido.'},{status:403});try{const options=listOptions(new URL(request.url).searchParams);const [result,phone]=await Promise.all([productList(database(),options,true),whatsapp()]);return Response.json({...result,whatsapp:phone},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return Response.json({error:e instanceof z.ZodError?'Filtros inválidos.':'No se pudo cargar la administración.'},{status:e instanceof z.ZodError?400:503});}}
export async function POST(request:Request){
 if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Acceso denegado.'},{status:403});
 try{
  if(Number(request.headers.get('content-length'))>30000)return Response.json({error:'Solicitud demasiado grande.'},{status:413});
  const input=z.object({action:z.string().optional(),whatsapp:z.unknown().optional(),id:z.unknown().optional(),product:z.unknown().optional()}).parse(await request.json());
  const db=database();
  if(input.action==='settings'){
   const value=z.string().regex(/^\d{10,15}$/).parse(input.whatsapp);
   await db.query("INSERT INTO settings (key,value) VALUES ('whatsapp',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[value]);
   return Response.json({ok:true});
  }
  if(input.action==='delete'){
   const id=z.string().regex(/^[a-zA-Z0-9-]{1,50}$/).parse(input.id);
   await deleteProduct(db,id);
   return Response.json({ok:true});
  }
  const product=schema.parse(input.product);
  await saveProduct(db,product);
  return Response.json({ok:true,product});
 }catch(e){console.error('admin save failed');return Response.json({error:e instanceof z.ZodError?(e.issues.find(issue=>issue.path.includes('salePrice'))?.message||'Revisa los campos: nombre, precio, tallas y al menos una imagen válida.'):'No se pudieron guardar los cambios. Inténtalo de nuevo.'},{status:e instanceof z.ZodError?400:503});}
}


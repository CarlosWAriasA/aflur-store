import {database,whatsapp} from '../../server';
import {samples} from '../../products';
import {listOptions,productList,sampleList} from '../../../lib/product-list.mjs';
import {z} from 'zod';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams,options=listOptions(params);
  const id=params.has('product')?z.string().regex(/^[a-zA-Z0-9-]{1,50}$/).parse(params.get('product')):null;
  const db=process.env.DATABASE_URL?database():null;
  const [states,phone,paged]=await Promise.all([db?db.query<{initialized:boolean}>("SELECT (EXISTS(SELECT 1 FROM products) OR EXISTS(SELECT 1 FROM settings WHERE key='initialized')) AS initialized"):Promise.resolve([{initialized:false}]),db?whatsapp():Promise.resolve('18293041914'),db&&!id?productList(db,options):Promise.resolve(null)]);
  const [state]=states;
  if(id){const rows=db&&state.initialized?await db.query<{data:typeof samples[number]}>('SELECT data FROM products WHERE id=$1 AND data->>\'status\'<>\'Oculto\' LIMIT 1',[id]):samples.filter(product=>product.id===id).map(data=>({data}));return Response.json({product:rows[0]?.data||null,whatsapp:phone},{status:rows.length?200:404,headers:{'Cache-Control':'no-store'}});}
  const result=state.initialized?paged:sampleList(samples,options);
  return Response.json({...result,whatsapp:phone},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:error instanceof z.ZodError?'Filtros inválidos.':'No se pudo cargar el catálogo.'},{status:error instanceof z.ZodError?400:503});}
}

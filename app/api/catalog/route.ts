import {allProducts,whatsapp} from '../../server';
import {samples} from '../../products';
export const dynamic='force-dynamic';
export async function GET(){
 if(!process.env.DATABASE_URL)return Response.json({products:samples,whatsapp:'18293041914'},{headers:{'Cache-Control':'no-store'}});
 try{return Response.json({products:await allProducts(),whatsapp:await whatsapp()},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('catalog',e);return Response.json({error:'No se pudo cargar el catálogo.'},{status:503});}
}

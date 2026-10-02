import {allProducts,whatsapp} from '../../server';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json({products:await allProducts(),whatsapp:await whatsapp()},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('catalog',e);return Response.json({error:'No se pudo cargar el catálogo.'},{status:503});}}

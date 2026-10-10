import {imageStorage} from '../../../../lib/r2.mjs';
import {imageKey} from '../../../../lib/image-format.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{key:string}>}){
 const {key}=await params;
 if(!imageKey.test(key))return new Response('No encontrada',{status:404});
 try{return new Response(null,{status:302,headers:{Location:await imageStorage().imageUrl(key),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
 catch{return new Response('No disponible',{status:503});}
}

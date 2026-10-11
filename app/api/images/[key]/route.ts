import {imageStorage} from '../../../../lib/cloudinary.mjs';
import {imageKey} from '../../../../lib/image-format.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{key:string}>}){
 const {key}=await params;
 if(!imageKey.test(key))return new Response('No encontrada',{status:404});
 const query=new URL(request.url).searchParams;
 try{return new Response(null,{status:302,headers:{Location:await imageStorage().imageUrl(key,query.get('original')==='1',query.get('variant')||'detail'),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
 catch{return new Response('No disponible',{status:503});}
}

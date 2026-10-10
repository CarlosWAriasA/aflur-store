import {isAdmin,sameOrigin} from '../../../server';
import {imageStorage} from '../../../../lib/r2.mjs';
import {imageKey} from '../../../../lib/image-format.mjs';
import {z} from 'zod';
export const runtime='nodejs';
export async function POST(request:Request){
 if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Acceso denegado.'},{status:403});
 if(Number(request.headers.get('content-length'))>2048)return Response.json({error:'Solicitud demasiado grande.'},{status:413});
 try{
  const {key}=z.object({key:z.string().regex(imageKey)}).parse(await request.json());
  return Response.json({url:await imageStorage().completeUpload(key)},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:error instanceof z.ZodError?'Imagen inválida.':'No se pudo verificar la foto. Revisa el formato, el tamaño y la configuración de R2.'},{status:error instanceof z.ZodError?400:503});}
}

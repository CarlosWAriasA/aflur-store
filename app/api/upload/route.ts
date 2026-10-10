import {isAdmin,sameOrigin} from '../../server';
import {imageStorage} from '../../../lib/r2.mjs';
import {imageTypes,maxImageBytes} from '../../../lib/image-format.mjs';
import {z} from 'zod';
export const runtime='nodejs';
const input=z.object({contentType:z.enum(['image/jpeg','image/png','image/webp']),size:z.number().int().min(1).max(maxImageBytes)});
export async function POST(request:Request){
 if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Acceso denegado.'},{status:403});
 if(Number(request.headers.get('content-length'))>2048)return Response.json({error:'Solicitud demasiado grande.'},{status:413});
 try{
  const {contentType,size}=input.parse(await request.json());
  const key=crypto.randomUUID()+'.'+imageTypes[contentType];
  const uploadUrl=await imageStorage().signUpload(key,contentType,size);
  return Response.json({key,uploadUrl},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:error instanceof z.ZodError?'Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.':'No se pudo preparar la subida. Comprueba la configuración de R2.'},{status:error instanceof z.ZodError?400:503});}
}

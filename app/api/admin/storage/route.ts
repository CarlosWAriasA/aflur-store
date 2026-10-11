import {isAdmin} from '../../../server';
import {cloudinaryUsage} from '../../../../lib/cloudinary-usage.mjs';
export const runtime='nodejs';
export async function GET(){
 if(!await isAdmin())return Response.json({error:'Acceso de administrador requerido.'},{status:403});
 try{return Response.json(await cloudinaryUsage(),{headers:{'Cache-Control':'private, no-store'}});}
 catch{return Response.json({error:'No se pudo consultar el uso de imágenes. Revisa las credenciales y los permisos de Cloudinary.'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
}

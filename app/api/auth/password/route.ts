import {getUser,authDb,cookieHeader} from '../../../auth';
import {sameOrigin} from '../../../server';
import {hashPassword,verifyPassword} from '../../../../lib/password.mjs';
import {z} from 'zod';
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Solicitud no permitida.'},{status:403});try{
 const user=await getUser();if(user?.role!=='admin')return Response.json({error:'Inicia sesión para cambiar tu contraseña.'},{status:403});
 if(Number(request.headers.get('content-length'))>4096)return Response.json({error:'Solicitud demasiado grande.'},{status:413});
 if(!await limitPassword(user.id))return Response.json({error:'Demasiados intentos. Espera 15 minutos.'},{status:429});
 const {currentPassword,newPassword}=z.object({currentPassword:z.string().min(1).max(128),newPassword:z.string().min(12).max(128)}).parse(await request.json());
 const row=await authDb().prepare('SELECT password_hash FROM users WHERE id=?').bind(user.id).first<{password_hash:string}>();
 if(!row||!verifyPassword(currentPassword,row.password_hash))return Response.json({error:'La contraseña actual es incorrecta.'},{status:400});
 await authDb().batch([authDb().prepare('UPDATE users SET password_hash=? WHERE id=?').bind(hashPassword(newPassword),user.id),authDb().prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)]);
 return Response.json({ok:true},{headers:{'Set-Cookie':cookieHeader(request,'',0),'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof z.ZodError?'La nueva contraseña debe tener entre 12 y 128 caracteres.':'No se pudo cambiar la contraseña.'},{status:e instanceof z.ZodError?400:503});}}
import {limitLogin} from '../../../auth';
const limitPassword=(id:string)=>limitLogin('password:'+id,10);

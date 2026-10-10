import {authDb,createSession,cookieHeader,limitLogin} from '../../../auth';
import {sameOrigin} from '../../../server';
import {verifyPassword,dummyHash} from '../../../../lib/password.mjs';
import {z} from 'zod';
const schema=z.object({username:z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,40}$/),password:z.string().min(1).max(128)});
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Solicitud no permitida.'},{status:403});
 try{
  if(Number(request.headers.get('content-length'))>4096)return Response.json({error:'Solicitud demasiado grande.'},{status:413});
  const input=schema.safeParse(await request.json());if(!input.success)return Response.json({error:'Usuario o contraseña incorrectos.'},{status:401});
  const accountAllowed=await limitLogin('account:'+input.data.username,10);
  const address=request.headers.get('x-forwarded-for')?.split(',')[0].trim()||'local';
  const addressAllowed=await limitLogin('address:'+address,60);
  if(!accountAllowed||!addressAllowed)return Response.json({error:'Demasiados intentos. Inténtalo de nuevo en 15 minutos.'},{status:429,headers:{'Retry-After':'900'}});
  const [user]=await authDb().query<{id:string;password_hash:string;role:string;active:boolean|number}>('SELECT id,password_hash,role,active FROM users WHERE username=$1',[input.data.username]);
  const valid=verifyPassword(input.data.password,user?.password_hash||dummyHash);
  if(!valid||!user?.active||user.role!=='admin')return Response.json({error:'Usuario o contraseña incorrectos.'},{status:401});
  const token=await createSession(user.id);
  return Response.json({ok:true},{headers:{'Set-Cookie':cookieHeader(request,token),'Cache-Control':'no-store'}});
 }catch{ return Response.json({error:'No se pudo iniciar sesión. Inténtalo de nuevo.'},{status:503});}
}

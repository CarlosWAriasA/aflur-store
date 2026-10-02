import {revokeSession,cookieHeader} from '../../../auth';
import {sameOrigin} from '../../../server';
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Solicitud no permitida.'},{status:403});try{await revokeSession();return Response.json({ok:true},{headers:{'Set-Cookie':cookieHeader(request,'',0),'Cache-Control':'no-store'}});}catch{return Response.json({error:'No se pudo cerrar la sesión. Inténtalo de nuevo.'},{status:503});}}

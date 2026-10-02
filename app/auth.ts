import {cookies} from 'next/headers';
import {createHash,randomBytes} from 'node:crypto';
import {env} from 'cloudflare:workers';
export const sessionCookie='aflur_session';
export type AuthUser={id:string;username:string;role:'admin'|'user'};
export function authDb(){if(!env.DB)throw Error('Base de datos no disponible');return env.DB;}
export function tokenHash(token:string){return createHash('sha256').update(token).digest('hex');}
export async function getUser():Promise<AuthUser|null>{
 const token=(await cookies()).get(sessionCookie)?.value;
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 return authDb().prepare('SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').bind(tokenHash(token),Date.now()).first<AuthUser>();
}
export async function isAdmin(){try{return (await getUser())?.role==='admin';}catch{return false;}}
export async function createSession(userId:string){const token=randomBytes(32).toString('hex');await authDb().prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(tokenHash(token),userId,Date.now()+12*60*60*1000).run();return token;}
export function cookieHeader(request:Request,token:string,maxAge=43200){const secure=new URL(request.url).protocol==='https:';return `${sessionCookie}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`;}
export async function revokeSession(){const token=(await cookies()).get(sessionCookie)?.value;if(token)await authDb().prepare('DELETE FROM sessions WHERE token_hash=?').bind(tokenHash(token)).run();}
export async function limitLogin(key:string,maximum:number){
 const now=Date.now(),cutoff=now-15*60*1000;
 const row=await authDb().prepare('INSERT INTO login_attempts (key,attempts,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END, window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END RETURNING attempts').bind(tokenHash(key),now,cutoff,cutoff).first<{attempts:number}>();
 return !!row&&row.attempts<=maximum;
}

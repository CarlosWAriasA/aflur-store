import {cookies} from 'next/headers';
import {createHash,randomBytes} from 'node:crypto';
import {database} from '../db';
import {recordLoginAttempt} from '../db/login-attempts.mjs';
export const sessionCookie='aflur_session';
export type AuthUser={id:string;username:string;role:'admin'|'user'};
export const authDb=database;
export function tokenHash(token:string){return createHash('sha256').update(token).digest('hex');}
export async function getUser():Promise<AuthUser|null>{
 const token=(await cookies()).get(sessionCookie)?.value;
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const [user]=await authDb().query<AuthUser>('SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2 AND u.active=true',[tokenHash(token),Date.now()]);
 return user||null;
}
export async function isAdmin(){try{return (await getUser())?.role==='admin';}catch{return false;}}
export async function createSession(userId:string){const token=randomBytes(32).toString('hex');await authDb().query('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)',[tokenHash(token),userId,Date.now()+12*60*60*1000]);return token;}
export function cookieHeader(request:Request,token:string,maxAge=43200){const secure=new URL(request.url).protocol==='https:';return `${sessionCookie}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`;}
export async function revokeSession(){const token=(await cookies()).get(sessionCookie)?.value;if(token)await authDb().query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(token)]);}
export async function limitLogin(key:string,maximum:number){
 const attempts=await recordLoginAttempt(authDb(),tokenHash(key),Date.now());
 return attempts>0&&attempts<=maximum;
}

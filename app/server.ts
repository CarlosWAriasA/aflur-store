import {database} from '../db';
export {database};
export {isAdmin} from './auth';
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export async function whatsapp(){const [row]=await database().query<{value:string}>("SELECT value FROM settings WHERE key = 'whatsapp'");return row?.value||'18293041914';}

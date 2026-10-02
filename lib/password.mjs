import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
const options={N:16384,r:8,p:5,maxmem:32*1024*1024};
export function hashPassword(password){
 if(typeof password!=='string'||password.length<12||password.length>128)throw new Error('Usa una contraseña de entre 12 y 128 caracteres.');
 const salt=randomBytes(16).toString('hex');
 return `scrypt$16384$8$5$${salt}$${scryptSync(password,salt,32,options).toString('hex')}`;
}
export function verifyPassword(password,stored){
 if(typeof password!=='string'||password.length>128)return false;
 const parts=stored.split('$');
 if(parts.length!==6||parts.slice(0,4).join('$')!=='scrypt$16384$8$5'||!/^[a-f0-9]{32}$/.test(parts[4])||!/^[a-f0-9]{64}$/.test(parts[5]))return false;
 const actual=scryptSync(password,parts[4],32,options);
 return timingSafeEqual(actual,Buffer.from(parts[5],'hex'));
}
export const dummyHash='scrypt$16384$8$5$'+'0'.repeat(32)+'$'+'0'.repeat(64);

import {env} from 'cloudflare:workers';
import {createDatabase} from './connection.mjs';
export type Statement={text:string;values?:unknown[]};
export function database(){
 const client=createDatabase(env);
 return {
  provider:client.provider,
  query:async <T>(text:string,values:unknown[]=[]):Promise<T[]> => client.query(text,values),
  transaction:(statements:Statement[])=>client.transaction(statements),
 };
}

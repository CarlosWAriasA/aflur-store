import {createDatabase} from './connection.mjs';
export type Statement={text:string;values?:unknown[]};
export function database(){
 const client=createDatabase({DATABASE_URL:process.env.DATABASE_URL});
 return {
  provider:client.provider,
  query:async <T>(text:string,values:unknown[]=[]):Promise<T[]> => client.query(text,values),
  transaction:(statements:Statement[])=>client.transaction(statements),
 };
}

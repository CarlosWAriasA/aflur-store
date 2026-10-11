import test from 'node:test';
import assert from 'node:assert/strict';
import {usageSummary,cloudinaryUsage} from '../lib/cloudinary-usage.mjs';

test('usage distinguishes missing limits from zero usage and excludes provider secrets',()=>{
 const result=usageSummary({plan:'Free',storage:{usage:0},bandwidth:{usage:2048,limit:4096},credits:{usage:1.2,limit:25},resources:3,api_secret:'private',last_updated:'2026-10-11'});
 assert.deepEqual(result.storage,{used:0,limit:null});
 assert.deepEqual(result.credits,{used:1.2,limit:25});
 assert.equal(result.resources,3);
 assert.equal(JSON.stringify(result).includes('private'),false);
 assert.deepEqual(usageSummary({storage:{usage:-1,limit:'25'},bandwidth:{usage:NaN},credits:{limit:Infinity}}).storage,{used:null,limit:null});
});
test('usage authenticates only server to server, caches provider reads and handles failure',async()=>{
 const names=['CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET'];
 const previous=names.map(name=>process.env[name]);
 try{
  [process.env.CLOUDINARY_CLOUD_NAME,process.env.CLOUDINARY_API_KEY,process.env.CLOUDINARY_API_SECRET]=['test-cloud','test-key','test-secret'];
  const result=await cloudinaryUsage(async(url,options)=>{
   assert.equal(url,'https://api.cloudinary.com/v1_1/test-cloud/usage');
   assert.equal(options.headers.Authorization,`Basic ${Buffer.from('test-key:test-secret').toString('base64')}`);
   assert.equal(options.next.revalidate,300);
   return Response.json({storage:{usage:1024},credits:{usage:0,limit:25}});
  });
  assert.equal(result.storage.used,1024);
  await assert.rejects(()=>cloudinaryUsage(async()=>new Response('',{status:401})),/No se pudo consultar/);
  delete process.env.CLOUDINARY_API_SECRET;
  await assert.rejects(()=>cloudinaryUsage(async()=>{throw Error('No debe solicitarse');}),/no está configurado/);
 }finally{names.forEach((name,index)=>{if(previous[index]===undefined)delete process.env[name];else process.env[name]=previous[index];});}
});

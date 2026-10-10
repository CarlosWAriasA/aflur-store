import test from 'node:test';
import assert from 'node:assert/strict';
import {S3Client} from '@aws-sdk/client-s3';
import {createStorage} from '../lib/r2.mjs';
import {maxImageBytes} from '../lib/image-format.mjs';

const key='12345678-1234-1234-1234-123456789abc.png';
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
function fixture(head={},bytes=png){
 const commands=[];
 const client={async send(command){commands.push(command);switch(command.constructor.name){
  case 'HeadObjectCommand':return {ContentLength:12,ContentType:'image/png',ETag:'"version-one"',...head};
  case 'GetObjectCommand':return {Body:{async transformToByteArray(){return bytes;}}};
  default:return {};
 }}};
 return {commands,storage:createStorage(client,'photos',async(_client,command,options)=>({command,options}))};
}
test('uploads are limited to a temporary key, MIME type and five MB',async()=>{
 const {storage}=fixture();
 const result=await storage.signUpload(key,'image/png',maxImageBytes);
 assert.equal(result.command.input.Key,`pending/${key}`);
 assert.equal(result.command.input.ContentLength,maxImageBytes);
 assert.equal(result.options.expiresIn,300);
 assert.deepEqual([...result.options.signableHeaders],['content-type','content-length']);
 await assert.rejects(storage.signUpload(key,'image/png',maxImageBytes+1));
 await assert.rejects(storage.signUpload(key,'text/html',12));
 await assert.rejects(storage.signUpload('../image.png','image/png',12));
});
test('publishing validates bytes and conditionally copies the same object version',async()=>{
 const {storage,commands}=fixture();
 assert.equal(await storage.completeUpload(key),`/api/images/${key}`);
 const read=commands.find(c=>c.constructor.name==='GetObjectCommand');
 assert.equal(read.input.Range,'bytes=0-11');
 assert.equal(read.input.IfMatch,'"version-one"');
 const copy=commands.find(c=>c.constructor.name==='CopyObjectCommand');
 assert.equal(copy.input.Key,key);
 assert.equal(copy.input.CopySource,`photos/pending/${key}`);
 assert.equal(copy.input.CopySourceIfMatch,'"version-one"');
 assert.equal(commands.at(-1).constructor.name,'DeleteObjectCommand');
});
test('oversized, wrong type, unversioned and forged files are never published',async()=>{
 for(const [head,bytes] of [[{ContentLength:maxImageBytes+1},png],[{ContentType:'text/html'},png],[{ETag:undefined},png],[{},new TextEncoder().encode('<html>oops')]]){
  const {storage,commands}=fixture(head,bytes);
  await assert.rejects(storage.completeUpload(key));
  assert.equal(commands.some(c=>c.constructor.name==='CopyObjectCommand'),false);
  assert.equal(commands.at(-1).constructor.name,'DeleteObjectCommand');
 }
});
test('reads use expiring signed GET URLs without making the bucket public',async()=>{
 const {storage}=fixture();
 const result=await storage.imageUrl(key);
 assert.equal(result.command.input.Key,key);
 assert.equal(result.options.expiresIn,900);
 await assert.rejects(storage.imageUrl('../private'));
});
test('AWS signer includes size and type in the actual upload signature',async()=>{
 const client=new S3Client({region:'auto',endpoint:'https://example.r2.cloudflarestorage.com',credentials:{accessKeyId:'test-key',secretAccessKey:'test-secret'},requestChecksumCalculation:'WHEN_REQUIRED'});
 try{
  const url=new URL(await createStorage(client,'photos').signUpload(key,'image/png',12));
  assert.equal(url.hostname,'photos.example.r2.cloudflarestorage.com');
  assert.equal(url.pathname,`/pending/${key}`);
  const headers=url.searchParams.get('X-Amz-SignedHeaders').split(';');
  assert.ok(headers.includes('content-type'));
  assert.ok(headers.includes('content-length'));
  assert.equal(url.searchParams.get('X-Amz-Expires'),'300');
 }finally{client.destroy();}
});

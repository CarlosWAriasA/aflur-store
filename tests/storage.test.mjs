import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createStorage,cloudinarySignature} from '../lib/cloudinary.mjs';
import {maxImageBytes} from '../lib/image-format.mjs';

const key='12345678-1234-1234-1234-123456789abc.png';
const id='aflur/products/12345678-1234-1234-1234-123456789abc';
const credentials={cloudName:'test-cloud',apiKey:'test-api-key',apiSecret:'test-secret'};
function fixture(overrides={},status=200){
 const calls=[];
 const storage=createStorage(credentials,async(url,options)=>{
  calls.push({url,options});
  return Response.json(url.endsWith('/destroy')?{result:'ok'}:{public_id:id,resource_type:'image',type:'upload',bytes:1000,format:'png',width:800,height:1000,...overrides},{status});
 },()=>1700000000000);
 return {storage,calls};
}
test('signature follows the sorted Cloudinary SHA-256 contract',()=>{
 const parameters={version:1315060510,public_id:'sample'};
 const expected=createHash('sha256').update('public_id=sample&version=1315060510abcd').digest('hex');
 assert.equal(cloudinarySignature(parameters,'abcd'),expected);
 assert.notEqual(cloudinarySignature({...parameters,public_id:'other'},'abcd'),expected);
});
test('upload signature binds a unique image ID, format, no-overwrite and timestamp without exposing the secret',async()=>{
 const {storage}=fixture();
 const upload=await storage.signUpload(key,'image/png',maxImageBytes);
 assert.equal(upload.uploadUrl,'https://api.cloudinary.com/v1_1/test-cloud/image/upload');
 const {signature,api_key,...parameters}=upload.fields;
 assert.equal(api_key,credentials.apiKey);
 assert.equal(parameters.public_id,id);
 assert.equal(parameters.overwrite,'false');
 assert.equal(parameters.allowed_formats,'png');
 assert.equal(parameters.type,'upload');
 assert.equal(parameters.timestamp,1700000000);
 assert.equal(signature,cloudinarySignature(parameters,credentials.apiSecret));
 assert.equal(JSON.stringify(upload).includes(credentials.apiSecret),false);
 for(const [candidate,type,size] of [[key,'image/png',maxImageBytes+1],[key,'image/png',0],[key,'image/jpeg',100],[key,'text/html',100],['../private.png','image/png',100]])await assert.rejects(storage.signUpload(candidate,type,size));
});
test('completion verifies metadata through a server-to-server signed request and returns a stable local image path',async()=>{
 const {storage,calls}=fixture({secure_url:'https://attacker.example/untrusted'});
 assert.equal(await storage.completeUpload(key),'/api/images/'+key);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://api.cloudinary.com/v1_1/test-cloud/image/explicit');
 const fields=Object.fromEntries(calls[0].options.body);
 assert.equal(fields.public_id,id);
 assert.equal(fields.type,'upload');
 const {signature,api_key,...parameters}=fields;
 assert.equal(signature,cloudinarySignature(parameters,credentials.apiSecret));
 assert.equal(String(calls[0].options.body).includes(credentials.apiSecret),false);
});
test('invalid stored size, format and dimensions are rejected and removed',async()=>{
 for(const metadata of [{bytes:maxImageBytes+1},{bytes:0},{bytes:'1000'},{format:'svg'},{format:'jpg'},{width:0},{height:undefined}]){
  const {storage,calls}=fixture(metadata);
  await assert.rejects(storage.completeUpload(key));
  assert.equal(calls.length,2);
  assert.ok(calls[1].url.endsWith('/destroy'));
  assert.equal(calls[1].options.body.get('public_id'),id);
 }
});
test('wrong identity, resource type, failed requests and invalid paths never succeed',async()=>{
 for(const metadata of [{public_id:'another-store/private'},{resource_type:'raw'},{type:'private'}]){
  const {storage,calls}=fixture(metadata);
  await assert.rejects(storage.completeUpload(key));
  assert.equal(calls.length,1); // Never destroy an unrelated asset.
 }
 const {storage,calls}=fixture({},401);
 await assert.rejects(storage.completeUpload(key));
 await assert.rejects(storage.completeUpload('../private'));
 assert.equal(calls.length,1);
});
test('delivery URLs stay in the configured cloud and fixed optimized image path',async()=>{
 const {storage}=fixture();
 assert.equal(await storage.imageUrl(key),`https://res.cloudinary.com/test-cloud/image/upload/f_auto,q_auto,c_limit,w_1600/${id}.png`);
 await assert.rejects(storage.imageUrl('../secret'));
 assert.throws(()=>createStorage({...credentials,cloudName:'evil.example/path'}));
 assert.throws(()=>createStorage({...credentials,apiSecret:''}));
});

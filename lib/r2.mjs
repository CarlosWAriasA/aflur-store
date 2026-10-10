import {S3Client,PutObjectCommand,GetObjectCommand,HeadObjectCommand,CopyObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {imageExtension,imageTypes,maxImageBytes,imageKey} from './image-format.mjs';

// Dependencies can be supplied by the storage tests; production uses R2's S3 API.
export function createStorage(client,bucket,sign=getSignedUrl){
 return {
  async signUpload(key,contentType,size){
   if(!imageKey.test(key)||!Object.hasOwn(imageTypes,contentType)||!Number.isInteger(size)||size<1||size>maxImageBytes)throw Error('Imagen inválida');
   return sign(client,new PutObjectCommand({Bucket:bucket,Key:`pending/${key}`,ContentType:contentType,ContentLength:size}),{expiresIn:300,signableHeaders:new Set(['content-type','content-length'])});
  },
  async completeUpload(key){
   if(!imageKey.test(key))throw Error('Imagen inválida');
   const pending=`pending/${key}`;
   const head=await client.send(new HeadObjectCommand({Bucket:bucket,Key:pending}));
   const size=head.ContentLength;
   const type=head.ContentType;
   if(!head.ETag||!size||size>maxImageBytes||!Object.hasOwn(imageTypes,type||'')){
    await client.send(new DeleteObjectCommand({Bucket:bucket,Key:pending}));
    throw Error('Imagen inválida');
   }
   const object=await client.send(new GetObjectCommand({Bucket:bucket,Key:pending,Range:'bytes=0-11',IfMatch:head.ETag}));
   const bytes=await object.Body.transformToByteArray();
   const extension=imageExtension(bytes);
   if(!extension||extension!==key.split('.').pop()||imageTypes[type]!==extension){
    await client.send(new DeleteObjectCommand({Bucket:bucket,Key:pending}));
    throw Error('Imagen inválida');
   }
   // Publish only validated bytes; the signed PUT can overwrite pending files only.
   await client.send(new CopyObjectCommand({Bucket:bucket,Key:key,CopySource:`${bucket}/${pending}`,CopySourceIfMatch:head.ETag,ContentType:type,CacheControl:'public, max-age=86400',MetadataDirective:'REPLACE'}));
   await client.send(new DeleteObjectCommand({Bucket:bucket,Key:pending})).catch(()=>{});
   return `/api/images/${key}`;
  },
  async imageUrl(key){
   if(!imageKey.test(key))throw Error('Imagen inválida');
   return sign(client,new GetObjectCommand({Bucket:bucket,Key:key}),{expiresIn:900});
  },
 };
}

export function imageStorage(){
 const {R2_ACCOUNT_ID,R2_ACCESS_KEY_ID,R2_SECRET_ACCESS_KEY,R2_BUCKET_NAME}=process.env;
 if(!R2_ACCOUNT_ID||!R2_ACCESS_KEY_ID||!R2_SECRET_ACCESS_KEY||!R2_BUCKET_NAME)throw Error('Configura las variables privadas de R2.');
 const client=new S3Client({region:'auto',endpoint:`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:R2_ACCESS_KEY_ID,secretAccessKey:R2_SECRET_ACCESS_KEY},requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED'});
 return createStorage(client,R2_BUCKET_NAME);
}

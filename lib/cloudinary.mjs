import {createHash} from 'node:crypto';
import {imageTypes,maxImageBytes,imageKey} from './image-format.mjs';

// Cloudinary's documented signature format: sorted parameters + API secret.
export function cloudinarySignature(parameters,secret){
 const payload=Object.keys(parameters).sort().map(name=>`${name}=${parameters[name]}`).join('&');
 return createHash('sha256').update(payload+secret).digest('hex');
}

export function createStorage({cloudName,apiKey,apiSecret},request=fetch,now=Date.now){
 if(!/^[a-z0-9_-]+$/i.test(cloudName||'')||!apiKey||!apiSecret)throw Error('Configura las variables privadas de Cloudinary.');
 const endpoint=`https://api.cloudinary.com/v1_1/${cloudName}/image`;
 function publicId(key){
  if(!imageKey.test(key))throw Error('Imagen inválida');
  return `aflur/products/${key.replace(/\.(jpg|png|webp)$/,'')}`;
 }
 function signed(parameters){return {...parameters,api_key:apiKey,signature:cloudinarySignature(parameters,apiSecret)};}
 async function call(action,parameters){
  const fields=signed({...parameters,timestamp:Math.floor(now()/1000)});
  const response=await request(`${endpoint}/${action}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(Object.entries(fields).map(([key,value])=>[key,String(value)])),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Cloudinary no pudo verificar la imagen.');
  return response.json();
 }
 return {
  async signUpload(key,contentType,size){
   const id=publicId(key);
   if(!Object.hasOwn(imageTypes,contentType)||imageTypes[contentType]!==key.split('.').pop()||!Number.isInteger(size)||size<1||size>maxImageBytes)throw Error('Imagen inválida');
   return {uploadUrl:`${endpoint}/upload`,fields:signed({public_id:id,timestamp:Math.floor(now()/1000),overwrite:'false',allowed_formats:imageTypes[contentType],type:'upload'})};
  },
  async completeUpload(key){
   const id=publicId(key);
   // Read authoritative metadata from Cloudinary, never trust the browser's upload response.
   const asset=await call('explicit',{public_id:id,type:'upload'});
   if(asset.public_id!==id||asset.resource_type!=='image'||asset.type!=='upload')throw Error('Imagen inválida');
   if(!Number.isInteger(asset.bytes)||asset.bytes<1||asset.bytes>maxImageBytes||asset.format!==key.split('.').pop()||!Number.isInteger(asset.width)||asset.width<1||!Number.isInteger(asset.height)||asset.height<1){
    await call('destroy',{public_id:id,type:'upload',invalidate:'true'});
    throw Error('Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.');
   }
   return `/api/images/${key}`;
  },
  async imageUrl(key,original=false,variant='detail'){
   const id=publicId(key);
   // Use a fixed high-quality rendition without upscaling; the fullscreen viewer requests the original.
   const width=variant==='card'?800:variant==='thumb'?160:2560;
   return `https://res.cloudinary.com/${cloudName}/image/upload/${original?'':`c_limit,w_${width}/f_auto/q_auto:best/`}${id}.${key.split('.').pop()}`;
  },
 };
}

export function imageStorage(){
 return createStorage({cloudName:process.env.CLOUDINARY_CLOUD_NAME,apiKey:process.env.CLOUDINARY_API_KEY,apiSecret:process.env.CLOUDINARY_API_SECRET});
}

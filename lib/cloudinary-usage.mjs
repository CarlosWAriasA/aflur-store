const nonnegative=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;
export function usageSummary(data){
 const metric=value=>({used:nonnegative(value?.usage),limit:nonnegative(value?.limit)});
 return {plan:typeof data.plan==='string'?data.plan:null,updatedAt:typeof data.last_updated==='string'?data.last_updated:null,storage:metric(data.storage),bandwidth:metric(data.bandwidth),credits:metric(data.credits),resources:nonnegative(data.resources)};
}
export async function cloudinaryUsage(request=fetch){
 const cloudName=process.env.CLOUDINARY_CLOUD_NAME,apiKey=process.env.CLOUDINARY_API_KEY,apiSecret=process.env.CLOUDINARY_API_SECRET;
 if(!/^[a-z0-9_-]+$/i.test(cloudName||'')||!apiKey||!apiSecret)throw Error('Cloudinary no está configurado.');
 const response=await request(`https://api.cloudinary.com/v1_1/${cloudName}/usage`,{headers:{Authorization:`Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`},next:{revalidate:300},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('No se pudo consultar Cloudinary.');
 return usageSummary(await response.json());
}

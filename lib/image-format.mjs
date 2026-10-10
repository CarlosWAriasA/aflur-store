export const maxImageBytes=5*1024*1024;
export const imageTypes={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
export const imageKey=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|png|webp)$/;
export function imageExtension(bytes){
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpg';
 if(bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10')return 'png';
 if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')return 'webp';
 return null;
}

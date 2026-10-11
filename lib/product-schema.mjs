import {z} from 'zod';
import {categories,audiences} from './product-options.mjs';
import {imageKey} from './image-format.mjs';
const amount=z.number().positive().max(1000000).refine(value=>Math.abs(value*100-Math.round(value*100))<0.000001,'Usa un máximo de dos decimales.');
const image=z.string().max(2000).refine(value=>value.startsWith('/api/images/')&&imageKey.test(value.slice('/api/images/'.length)));
export const productSchema=z.object({id:z.string().regex(/^[a-zA-Z0-9-]{1,50}$/),name:z.string().trim().min(2).max(120),category:z.enum(categories.slice(1)),audience:z.enum(audiences),price:amount,salePrice:amount.nullish(),sizes:z.array(z.string().trim().min(1).max(12)).min(1).max(30),images:z.array(image).min(1).max(8).refine(images=>new Set(images).size===images.length),description:z.string().max(2000),status:z.enum(['Disponible','Agotado','Oculto']),featured:z.boolean()}).superRefine((product,context)=>{if(product.salePrice!=null&&product.salePrice>=product.price)context.addIssue({code:'custom',path:['salePrice'],message:'El precio de oferta debe ser menor que el precio normal.'});});

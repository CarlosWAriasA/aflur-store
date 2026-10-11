import {z} from 'zod';
import {categories,audiences} from './product-options.mjs';
export const pageSize=12;
export function listOptions(params){
 const value=name=>params.get(name)||undefined;
 return z.object({page:z.coerce.number().int().min(1).max(100000).default(1),search:z.string().max(120).default(''),category:z.enum(categories).default('Todos'),audience:z.enum(['Todos',...audiences]).default('Todos'),size:z.string().max(12).default(''),sort:z.enum(['featured','low','high']).default('featured'),maxPrice:z.coerce.number().min(0).max(1000000).optional(),ids:z.string().max(11000).optional()}).parse({page:value('page'),search:value('search'),category:value('category'),audience:value('audience'),size:value('size'),sort:value('sort'),maxPrice:value('maxPrice'),ids:params.has('ids')?params.get('ids'):undefined});
}
const price="CASE WHEN (data->>'salePrice')::numeric>0 AND (data->>'salePrice')::numeric<(data->>'price')::numeric THEN (data->>'salePrice')::numeric ELSE (data->>'price')::numeric END";
export async function productList(db,options,admin=false){
 const values=[],conditions=admin?[]:["data->>'status'<>'Oculto'"];
 const bind=value=>{values.push(value);return `$${values.length}`;};
 if(options.search)conditions.push(`strpos(lower(concat_ws(' ',data->>'name',id,data->>'category')),lower(${bind(options.search.trim())}))>0`);
 if(options.category!=='Todos')conditions.push(`data->>'category'=${bind(options.category)}`);
 if(options.audience!=='Todos')conditions.push(`(data->>'audience'=${bind(options.audience)} OR data->>'audience'='Unisex')`);
 if(options.size)conditions.push(`data->'sizes' ? ${bind(options.size)}`);
 if(options.maxPrice!==undefined)conditions.push(`(${price})<=${bind(options.maxPrice)}`);
 if(options.ids!==undefined){const ids=options.ids.split(',').filter(id=>/^[a-zA-Z0-9-]{1,50}$/.test(id)).slice(0,200);conditions.push(`id=ANY(${bind(ids)}::text[])`);}
 const where=conditions.length?`WHERE ${conditions.join(' AND ')}`:'';
 const visibility=admin?'':"WHERE data->>'status'<>'Oculto'";
 const [[count],[summary]]=await Promise.all([
  db.query(`SELECT count(*)::int AS total FROM products ${where}`,values),
  db.query(`SELECT count(*)::int AS inventory, count(*) FILTER (WHERE data->>'status'='Disponible')::int AS available, COALESCE(sum(jsonb_array_length(data->'images')),0)::int AS images, COALESCE(jsonb_agg(DISTINCT data->>'category'),'[]') AS categories, COALESCE(jsonb_agg(DISTINCT data->>'audience'),'[]') AS audiences, (SELECT COALESCE(jsonb_agg(DISTINCT size),'[]') FROM products CROSS JOIN LATERAL jsonb_array_elements_text(data->'sizes') AS size ${visibility}) AS sizes FROM products ${visibility}`),
 ]);
 const total=Number(count.total),pages=Math.max(1,Math.ceil(total/pageSize)),page=Math.min(options.page,pages);
 const sort=admin?'created_at DESC,id DESC':options.sort==='featured'?"COALESCE((data->>'featured')::boolean,false) DESC,created_at DESC,id DESC":`(${price}) ${options.sort==='low'?'ASC':'DESC'} NULLS LAST,created_at DESC,id DESC`;
 const rows=await db.query(`SELECT data FROM products ${where} ORDER BY ${sort} LIMIT ${bind(pageSize)} OFFSET ${bind((page-1)*pageSize)}`,values);
 return {products:rows.map(row=>typeof row.data==='string'?JSON.parse(row.data):row.data),pagination:{page,pages,pageSize,total},facets:{categories:summary.categories,audiences:summary.audiences,sizes:summary.sizes},stats:{total:Number(summary.inventory),available:Number(summary.available),images:Number(summary.images)}};
}
export function sampleList(products,options){
 const sellingPrice=p=>p.salePrice>0&&p.salePrice<p.price?p.salePrice:p.price;
 const filtered=products.filter(p=>p.status!=='Oculto'&&(options.category==='Todos'||p.category===options.category)&&(options.audience==='Todos'||p.audience===options.audience||p.audience==='Unisex')&&(!options.size||p.sizes.includes(options.size))&&(!options.search||`${p.name} ${p.id} ${p.category}`.toLowerCase().includes(options.search.trim().toLowerCase()))&&(options.maxPrice===undefined||(sellingPrice(p)!==null&&sellingPrice(p)<=options.maxPrice))&&(options.ids===undefined||options.ids.split(',').includes(p.id))).sort((a,b)=>options.sort==='featured'?Number(b.featured)-Number(a.featured):sellingPrice(a)===null?1:sellingPrice(b)===null?-1:options.sort==='low'?sellingPrice(a)-sellingPrice(b):sellingPrice(b)-sellingPrice(a));
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize)),page=Math.min(options.page,pages);
 return {products:filtered.slice((page-1)*pageSize,page*pageSize),pagination:{page,pages,pageSize,total:filtered.length},facets:{categories:[...new Set(products.map(p=>p.category))],audiences:[...new Set(products.map(p=>p.audience))],sizes:[...new Set(products.flatMap(p=>p.sizes))]},stats:{total:products.length,available:products.filter(p=>p.status==='Disponible').length,images:products.reduce((sum,p)=>sum+p.images.length,0)}};
}

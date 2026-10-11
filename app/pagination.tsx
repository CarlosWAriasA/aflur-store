import {ChevronLeft,ChevronRight} from 'lucide-react';
export default function Pagination({page,pages,total,pageSize,busy,onChange}:{page:number;pages:number;total:number;pageSize:number;busy:boolean;onChange:(page:number)=>void}){
 if(!total)return null;
 const start=(page-1)*pageSize+1,end=Math.min(page*pageSize,total);
 return <nav className="pagination" aria-label="Paginación de productos"><span>{start}–{end} de {total} productos</span><div><button type="button" aria-label="Página anterior" disabled={busy||page<=1} onClick={()=>onChange(page-1)}><ChevronLeft size={17}/></button><label>Página <select aria-label="Seleccionar página" disabled={busy||pages===1} value={page} onChange={event=>onChange(Number(event.target.value))}>{[...new Set([1,page-2,page-1,page,page+1,page+2,pages])].filter(value=>value>=1&&value<=pages).sort((a,b)=>a-b).map(value=><option key={value} value={value}>{value}</option>)}</select> de {pages}</label><button type="button" aria-label="Página siguiente" disabled={busy||page>=pages} onClick={()=>onChange(page+1)}><ChevronRight size={17}/></button></div></nav>;
}

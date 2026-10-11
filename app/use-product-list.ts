'use client';
import {useEffect,useRef,useState} from 'react';
import {Product} from './products';
type Result={products:Product[];whatsapp:string;pagination:{page:number;pages:number;pageSize:number;total:number};facets:{categories:string[];audiences:string[];sizes:string[]};stats:{total:number;available:number;images:number}};
export function useProductList(endpoint:string,filters:string){
 const [result,setResult]=useState<Result>({products:[],whatsapp:'18293041914',pagination:{page:1,pages:1,pageSize:12,total:0},facets:{categories:[],audiences:[],sizes:[]},stats:{total:0,available:0,images:0}}),[page,setPage]=useState(1),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const previousFilters=useRef(filters);
 useEffect(()=>{
  if(previousFilters.current!==filters){previousFilters.current=filters;if(page!==1){setPage(1);return;}}
  const controller=new AbortController();setLoading(true);setError('');
  const timer=setTimeout(async()=>{try{const response=await fetch(`${endpoint}?${filters}&page=${page}`,{signal:controller.signal});const data=await response.json() as Result&{error?:string};if(!response.ok)throw Error(data.error||'No se pudieron cargar los productos.');if(!controller.signal.aborted){setResult(data);if(data.pagination.page!==page)setPage(data.pagination.page);}}catch(e){if(!controller.signal.aborted){setError(e instanceof Error?e.message:'No se pudieron cargar los productos.');setResult(previous=>({...previous,products:[]}));}}finally{if(!controller.signal.aborted)setLoading(false);}},200);
  return()=>{clearTimeout(timer);controller.abort();};
 },[endpoint,filters,page,revision]);
 return {...result,page,setPage,loading,error,reload:()=>setRevision(value=>value+1)};
}

'use client';
import {useEffect,useRef,useState} from 'react';
import {X,ChevronLeft,ChevronRight,ZoomIn,ZoomOut} from 'lucide-react';

export default function ImageViewer({images,index,title,onChange,onClose}:{images:string[];index:number;title:string;onChange:(index:number)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [zoomed,setZoomed]=useState(false);
 useEffect(()=>{const element=dialog.current;const previous=document.activeElement as HTMLElement|null;element?.showModal();return()=>{element?.close();previous?.focus();};},[]);
 useEffect(()=>{setZoomed(false);},[index]);
 function previous(){onChange((index-1+images.length)%images.length);}
 function next(){onChange((index+1)%images.length);}
 return <dialog ref={dialog} className="image-viewer" aria-label={`Fotos de ${title}`} onCancel={event=>{event.preventDefault();onClose();}} onKeyDown={event=>{
  event.stopPropagation();
  if(images.length>1&&event.key==='ArrowLeft'){event.preventDefault();previous();}
  if(images.length>1&&event.key==='ArrowRight'){event.preventDefault();next();}
 }}>
  <header className="image-viewer-toolbar"><div><strong>{title}</strong><span>Foto {index+1} de {images.length}</span></div><button type="button" aria-label={zoomed?'Reducir imagen':'Ampliar imagen'} onClick={()=>setZoomed(!zoomed)}>{zoomed?<ZoomOut/>:<ZoomIn/>}</button><button type="button" autoFocus aria-label="Cerrar pantalla completa" onClick={onClose}><X/></button></header>
  <div className={`image-viewer-stage${zoomed?' is-zoomed':''}`}><button type="button" className="image-viewer-image" aria-label={zoomed?'Reducir foto':'Ampliar foto'} onClick={()=>setZoomed(!zoomed)}><img src={images[index]?.startsWith('/api/images/')?images[index]+'?original=1':images[index]||'/placeholder.svg'} alt={`${title}, foto ${index+1}`}/></button></div>
  {images.length>1&&<><button type="button" className="image-viewer-prev" aria-label="Foto anterior en pantalla completa" onClick={previous}><ChevronLeft/></button><button type="button" className="image-viewer-next" aria-label="Foto siguiente en pantalla completa" onClick={next}><ChevronRight/></button></>}
  <p className="image-viewer-hint">Toca la foto para {zoomed?'reducir':'ampliar'}{images.length>1?' · Usa las flechas para cambiar de foto':''}</p>
 </dialog>;
}

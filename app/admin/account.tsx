'use client';
import {useState} from 'react';

export default function Account({username}:{username:string}) {
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);

 async function logout() {
  setBusy(true);
  setError('');
  try {
   const response=await fetch('/api/auth/logout',{method:'POST'});
   if(!response.ok) throw Error('No se pudo cerrar sesión.');
   window.location.assign('/admin');
  } catch(error) {
   setError(error instanceof Error?error.message:'Inténtalo de nuevo.');
   setBusy(false);
  }
 }

 return <section>
  <div className="admin-account">
   <span>Administrador: {username}</span>
   <div><button disabled={busy} onClick={logout}>Cerrar sesión</button></div>
  </div>
  {error&&<p className="notice" role="alert">{error}</p>}
 </section>;
}

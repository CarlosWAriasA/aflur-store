import {getUser} from '../auth';
import Admin from './panel';
import Login from './login';
export const dynamic='force-dynamic';
export default async function Page(){try{const user=await getUser();return user?.role==='admin'?<Admin username={user.username}/>:<Login/>;}catch{return <main className="access"><h1>Administración</h1><p>No se pudo conectar con la tienda. Inténtalo de nuevo.</p><a className="button" href="/admin">Volver a intentar</a></main>;}}

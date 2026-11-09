import {redirect} from 'next/navigation';
import {isSuperadmin} from '../admin-auth';
import Dashboard from '../dashboard';
export const dynamic='force-dynamic';
export default async function Page(){if(!await isSuperadmin())redirect('/admin/login');return <Dashboard admin/>;}

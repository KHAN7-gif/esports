import {redirect} from 'next/navigation';
import {isSuperadmin} from '../../admin-auth';
export const dynamic='force-dynamic';
export default async function Page(){if(await isSuperadmin())redirect('/admin');redirect('/api/sso/start')}

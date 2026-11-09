import {redirect} from 'next/navigation';
import {isSuperadmin} from '../../admin-auth';
import LoginForm from './login-form';
export const dynamic='force-dynamic';
export default async function Page(){if(await isSuperadmin())redirect('/admin');return <LoginForm/>}

import {centralLoginEnabled} from '../../sso-auth';
import {redirect} from 'next/navigation';
import {isSuperadmin} from '../../admin-auth';
import LoginForm from './login-form';
export const dynamic='force-dynamic';
export default async function Page(){if(await isSuperadmin())redirect('/admin');if(await centralLoginEnabled())redirect('/api/sso/start');return <LoginForm/>}

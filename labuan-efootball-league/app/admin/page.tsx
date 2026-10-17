import {env} from 'cloudflare:workers';
import {requireChatGPTUser} from '../chatgpt-auth';
import Dashboard from '../dashboard';
export const dynamic='force-dynamic';
export default async function Admin(){const u=await requireChatGPTUser('/admin');if(!env.ADMIN_EMAIL||u.email.toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())return <main className="access-message"><h1>Akses admin diperlukan</h1><p>Log masuk dengan akaun pentadbir LEL.</p><a href="/signout-with-chatgpt?return_to=%2Fadmin">Tukar akaun</a><a href="/">Kembali ke liga</a></main>;return <Dashboard admin/>}

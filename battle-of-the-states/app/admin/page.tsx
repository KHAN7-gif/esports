import { requireChatGPTUser } from '../chatgpt-auth';
import Dashboard from '../dashboard';
export const dynamic='force-dynamic';
export default async function Page(){const u=await requireChatGPTUser('/admin');if(u.email.toLowerCase()!=='apengtakahashi@gmail.com')return <main className="denied"><h1>Akses terhad</h1><p>Akaun ini tidak mempunyai akses admin.</p><a href="/">Kembali ke paparan awam</a></main>;return <Dashboard admin/>;}

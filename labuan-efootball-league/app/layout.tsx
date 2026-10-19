import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'LEL · Labuan eFootball League',applicationName:'LEL',description:'eFootball Mobile & Konsol. Group stage BO1 dan knockout BO3 / Aggregate.',manifest:'/lel.webmanifest',appleWebApp:{capable:true,title:'LEL',statusBarStyle:'default'},icons:{icon:[{url:'/favicon-48.png?v=20261019',sizes:'48x48',type:'image/png'},{url:'/icon-192.png?v=20261019',sizes:'192x192',type:'image/png'}],apple:[{url:'/apple-touch-icon.png?v=20261019',sizes:'180x180',type:'image/png'}]}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#102448'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ms"><body>{children}</body></html>}

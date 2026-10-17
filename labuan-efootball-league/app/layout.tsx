import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'LEL · Labuan eFootball League',description:'eFootball Mobile & Konsol. Group stage BO1 dan knockout Home/Away.',icons:{icon:'/lel-logo.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#102448'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ms"><body>{children}</body></html>}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppSplash from "@/components/app-splash";

export const viewport: Viewport = {width:"device-width",initialScale:1,viewportFit:"cover"};

export const metadata: Metadata = {
  title: "eFLL | eFootball Mobile",
  description: "Jadual, keputusan dan kedudukan liga eFootball Mobile.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" data-theme="light">

      <body className="antialiased"><AppSplash />{children}</body>
    </html>
  );
}

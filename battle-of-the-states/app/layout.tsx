import type { Metadata } from "next";
import "./globals.css";
import AppSplash from "@/components/app-splash";

export const metadata: Metadata = {
  title: "Battle of the States | eFootball Mobile",
  description: "Jadual, keputusan dan kedudukan liga eFootball Mobile.",
  icons: {
    icon: "/favicon.svg",
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

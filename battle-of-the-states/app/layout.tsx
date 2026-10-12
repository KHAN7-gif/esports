import type { Metadata } from "next";
import "./globals.css";
import AppSplash from "@/components/app-splash";

export const metadata: Metadata = {
  title: "Battle of the States | eFootball Mobile",
  description: "Jadual, keputusan dan kedudukan liga eFootball Mobile.",
  manifest: "/manifest.webmanifest?v=20261012-white-icons",
  icons: {
    icon: [
      { url: "/icon-192.png?v=20261012-white-icons", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=20261012-white-icons", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192.png?v=20261012-white-icons",
    apple: "/icon-192.png?v=20261012-white-icons",
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

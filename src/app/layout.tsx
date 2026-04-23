import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/layout/nav";

export const metadata: Metadata = {
  title: "HL Portfolio",
  description: "Multi-wallet portfolio tracker for Hyperliquid",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap"
        />
        <script
          // Avoid flash of wrong theme. Runs before paint.
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const t=localStorage.getItem('hl-theme')||'dark';if(t==='light')document.documentElement.classList.add('light');const s=localStorage.getItem('hl-settings');if(s){const j=JSON.parse(s);if(j&&j.state&&j.state.privacy)document.documentElement.classList.add('privacy');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-fg">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

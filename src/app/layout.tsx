import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono, Jost } from "next/font/google";
import { DemoBanner } from "@/components/demo-banner";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const heading = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: `${BRAND.club} — ${BRAND.app}`,
  description: "Ausweisprüfung für Club-Mitarbeiter",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND.shortName,
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: BRAND.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${sans.variable} ${heading.variable} ${mono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <DemoBanner />
          {children}
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}

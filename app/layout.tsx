import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import { MobileTabs } from "@/components/mobile-tabs";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://accralife.app"),
  title: {
    default: "Accra Life — live your Accra story",
    template: "%s · Accra Life",
  },
  description: "A life you can play, set in Accra. Chop waakye, catch a trotro, dance in Osu, survive dumsor, and make your name.",
  applicationName: "Accra Life",
  openGraph: {
    title: "Accra Life — live your Accra story",
    description: "A life you can play, set in Accra. Chop waakye, catch a trotro, dance in Osu, survive dumsor, and make your name.",
    url: "https://accralife.app",
    siteName: "Accra Life",
    locale: "en_GH",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff6df",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get("x-pathname") ?? "";
  const game = path === "/" || path === "";

  return (
    <html lang="en" className={`${jakarta.variable} ${fredoka.variable} h-full antialiased`}>
      <body className={game ? "fixed inset-0 h-dvh w-full overflow-hidden overscroll-none bg-[#fff6df] text-[#121212]" : "min-h-full bg-paper text-ink"}>
        {game ? null : <SiteHeader />}
        <main id="main" className={game ? "h-full overflow-hidden" : "pb-24 md:pb-0"}>
          {children}
        </main>
        {game ? null : (
          <>
            <SiteFooter />
            <MobileTabs />
          </>
        )}
      </body>
    </html>
  );
}

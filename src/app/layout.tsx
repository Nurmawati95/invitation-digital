import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BRAND, COUPLE, SITE_URL } from "@/lib/wedding";

/* Tipografi mewah: Serif untuk judul & nama mempelai */
const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display-src",
  display: "swap",
  fallback: ["Playfair Display", "Georgia", "Times New Roman", "serif"],
});

/* Tipografi isi & UI: sans-serif modern */
const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans-src",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "Helvetica Neue", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: `UNDIGITAL | The Wedding of ${COUPLE.groom.shortName} & ${COUPLE.bride.shortName}`,
  description: `Undangan Pernikahan Digital ${COUPLE.groom.fullName} & ${COUPLE.bride.fullName} — 11 April 2027. Dibuat dengan oleh ${BRAND.name} — ${BRAND.tagline}.`,
  keywords: [
    "undangan pernikahan digital",
    "wedding invitation",
    "UNDIGITAL",
    COUPLE.groom.fullName,
    COUPLE.bride.fullName,
  ],
  metadataBase: new URL(SITE_URL),
  authors: [{ name: BRAND.name, url: BRAND.instagram }],
  creator: BRAND.name,
  publisher: BRAND.name,
  applicationName: BRAND.name,
  icons: {
    icon: [{ url: BRAND.logo, type: "image/jpeg" }],
    shortcut: [BRAND.logo],
    apple: [{ url: BRAND.logo }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: `UNDIGITAL | The Wedding of ${COUPLE.groom.shortName} & ${COUPLE.bride.shortName}`,
    description: `Dengan bahagia kami mengundang Anda hadir di hari bahagia kami — 11 April 2027.`,
    siteName: BRAND.name,
    images: [
      {
        url: "/images/hero.jpg",
        width: 1200,
        height: 630,
        alt: `${COUPLE.groom.shortName} & ${COUPLE.bride.shortName} — Pre Wedding`,
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `UNDIGITAL | The Wedding of ${COUPLE.groom.shortName} & ${COUPLE.bride.shortName}`,
    description: "Undangan Pernikahan Digital oleh UNDIGITAL.",
    images: ["/images/hero.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#143B27",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${displayFont.variable} ${bodyFont.variable}`}
      data-locked="true"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/ico_undigital.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/ico_undigital.jpg" />
        <link rel="shortcut icon" href="/ico_undigital.jpg" />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </head>
      <body className="bg-mist font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}

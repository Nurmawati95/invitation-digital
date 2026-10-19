import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNDIGITAL — Architecture Delivery",
  description: "Fondasi arsitektur SaaS undangan digital yang instan, aman, dan mobile-first.",
  applicationName: "UNDIGITAL",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12100e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

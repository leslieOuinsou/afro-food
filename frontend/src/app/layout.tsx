import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lato, Syne } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const fontTitle = Cormorant_Garamond({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const fontUI = Syne({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontBody = Lato({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Afro-food - Cuisine Camerounaise et Béninoise",
  description: "Découvrez les saveurs authentiques du Cameroun et du Bénin avec Afro-food. Livraison de plats traditionnels à domicile.",
  appleWebApp: { capable: true, title: "Afro-food", statusBarStyle: "default" },
  icons: {
    icon: "/logo-afro-eats.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#d4651a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Préconnexion Google Fonts (complète next/font et tout chargement CDN / style inline) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/logo-afro-eats.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${fontTitle.variable} ${fontUI.variable} ${fontBody.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

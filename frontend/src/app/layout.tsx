import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Afro-Eats - Cuisine Camerounaise et Béninoise",
  description: "Découvrez les saveurs authentiques du Cameroun et du Bénin avec Afro-Eats. Livraison de plats traditionnels à domicile.",
  icons: {
    icon: "/logo-afro-eats.png",
    apple: "/logo-afro-eats.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/logo-afro-eats.png" />
        <link rel="apple-touch-icon" href="/logo-afro-eats.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

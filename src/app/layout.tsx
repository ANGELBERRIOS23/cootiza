import type { Metadata } from "next";
import { Archivo_Black, Nunito } from "next/font/google";
import "./globals.css";

const displayFont = Archivo_Black({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const bodyFont = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Paquetes Viajexmundo",
  description: "Catalogo visual de paquetes de viaje con conversion a WhatsApp",
  icons: {
    icon: "/favicon.ico?v=2",
    shortcut: "/favicon.ico?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>{children}</body>
    </html>
  );
}

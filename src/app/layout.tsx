import type { Metadata } from "next";
import { Archivo_Black, Nunito } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// Aplica el tema guardado ANTES del primer paint (evita el flash claro→oscuro).
const themeNoFlashScript = `(function(){try{var t=localStorage.getItem('cooitza-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

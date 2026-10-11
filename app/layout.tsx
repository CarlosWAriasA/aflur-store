import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./product-editor.css";

export const metadata: Metadata = {
  title: "Aflur Store | Ropa y calzado · Pull&Bear y Zara",
  description: "Ropa y calzado en Aflur Store. Prendas de Pull&Bear y Zara por categoría, talla y precio. Consulta por WhatsApp.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}

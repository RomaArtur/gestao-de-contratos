import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import { Provedor } from "@/components/provedor";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Sacramento Imóveis",
  description: "Gestão de imóveis, propostas e contratos",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className={`${manrope.className} flex min-h-full flex-col`}>
        <Provedor>{children}</Provedor>
      </body>
    </html>
  );
}

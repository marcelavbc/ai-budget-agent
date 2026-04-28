import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Pressupost de pintura",
  description:
    "Genera pressupostos de pintura ràpidament a partir d’una descripció breu.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <Header />
        {children}
      </body>
    </html>
  );
}

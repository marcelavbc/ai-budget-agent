import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pressupost de pintura",
  description:
    "Genera pressupostos de pintura ràpidament a partir d’una descripció breu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StrideForge Running Shoes",
  description: "A stylish running shoes store with a responsive catalog and basket.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}

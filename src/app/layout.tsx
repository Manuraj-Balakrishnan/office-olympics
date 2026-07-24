import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/layout/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Office Olympics",
  description: "Jackbox-meets-Kahoot office mini-game tournament platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

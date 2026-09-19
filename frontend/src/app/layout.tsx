import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atlas — Distributed Workflows for Real-World Builders",
  description: "Orchestrate, schedule, and run complex tasks at scale with DAG workflows, deep observability, and fault-tolerant execution.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${caveat.variable} scroll-smooth`}>
      <body className="min-h-screen bg-atlas-cream text-atlas-black font-sans antialiased selection:bg-atlas-lime selection:text-atlas-black">
        {children}
      </body>
    </html>
  );
}

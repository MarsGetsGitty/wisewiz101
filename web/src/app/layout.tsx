import type { Metadata } from "next";
import { Outfit, Cinzel } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WiseWiz101 — Gear Database",
  description:
    "Browse, search, and filter all 50,000+ Wizard101 gear items with real stats extracted from game data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${cinzel.variable} font-sans antialiased selection:bg-primary-500/30`}
      >
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 border-b border-border bg-surface-900/80 px-6 py-4 backdrop-blur-md">
            <h1 className="font-display text-2xl font-bold tracking-wider text-accent-500 drop-shadow-[0_2px_10px_rgba(244,208,63,0.3)]">
              WiseWiz101
            </h1>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

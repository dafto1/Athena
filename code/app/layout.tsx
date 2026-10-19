import type { Metadata } from "next";
import { Newsreader, Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Athena — Disciplined Academic Study Workspace",
  description: "Calm, structured focus for serious scholarship. Timers, course readings, and peer study rooms—unified in one distraction-free workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#FAF9F6] text-[#292825]`}
      >
        {children}
      </body>
    </html>
  );
}
